use reqwest::Client;
use serde::{Deserialize, Serialize};
use std::sync::Arc;
use tokio::sync::RwLock;
use crate::error::{AppError, Result};

/// API response wrapper
#[derive(Debug, Deserialize)]
struct GraphQLResponse<T> {
    data: Option<T>,
    errors: Option<Vec<GraphQLError>>,
}

#[derive(Debug, Deserialize)]
struct GraphQLError {
    message: String,
}

/// Auth tokens
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AuthTokens {
    pub access_token: String,
    pub refresh_token: String,
    pub expires_at: i64,
}

/// User info from API
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ApiUser {
    pub id: String,
    pub email: String,
    pub subscription: ApiSubscription,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ApiSubscription {
    pub plan: String,
    pub expires_at: String,
    pub is_active: bool,
}

/// Server from API
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ApiServer {
    pub id: String,
    pub name: String,
    pub country: String,
    pub country_code: String,
    pub city: String,
    pub lat: f64,
    pub lng: f64,
    pub hostname: String,
    pub ip: String,
    pub port: u16,
    pub public_key: String,
    pub supported_protocols: Vec<String>,
    pub features: Vec<String>,
    pub load: Option<u32>,
    pub is_premium: bool,
}

pub struct ApiClient {
    client: Client,
    base_url: String,
    tokens: Arc<RwLock<Option<AuthTokens>>>,
}

impl ApiClient {
    pub fn new(base_url: &str) -> Self {
        let client = Client::builder()
            .timeout(std::time::Duration::from_secs(30))
            .user_agent("VPNht-Desktop/0.2.0")
            .build()
            .expect("Failed to create HTTP client");
        
        Self {
            client,
            base_url: base_url.to_string(),
            tokens: Arc::new(RwLock::new(None)),
        }
    }

    pub async fn set_tokens(&self, tokens: AuthTokens) {
        *self.tokens.write().await = Some(tokens);
    }

    pub async fn clear_tokens(&self) {
        *self.tokens.write().await = None;
    }

    async fn graphql_request<T: for<'de> Deserialize<'de>>(&self, query: &str, variables: Option<serde_json::Value>) -> Result<T> {
        let mut body = serde_json::json!({ "query": query });
        if let Some(vars) = variables {
            body["variables"] = vars;
        }

        let mut request = self.client.post(&format!("{}/graphql", self.base_url))
            .json(&body);
        
        // Add auth header if we have tokens
        if let Some(tokens) = self.tokens.read().await.as_ref() {
            request = request.bearer_auth(&tokens.access_token);
        }

        let response = request.send().await?;
        
        if response.status() == reqwest::StatusCode::UNAUTHORIZED {
            // Try token refresh
            if self.refresh_token().await.is_ok() {
                // Retry with new token
                let mut retry_request = self.client.post(&format!("{}/graphql", self.base_url))
                    .json(&body);
                if let Some(tokens) = self.tokens.read().await.as_ref() {
                    retry_request = retry_request.bearer_auth(&tokens.access_token);
                }
                let retry_response = retry_request.send().await?;
                let gql: GraphQLResponse<T> = retry_response.json().await?;
                return self.extract_data(gql);
            }
            return Err(AppError::Auth("Session expired. Please log in again.".into()));
        }

        let gql: GraphQLResponse<T> = response.json().await?;
        self.extract_data(gql)
    }

    fn extract_data<T>(&self, response: GraphQLResponse<T>) -> Result<T> {
        if let Some(errors) = response.errors {
            let msg = errors.into_iter().map(|e| e.message).collect::<Vec<_>>().join(", ");
            return Err(AppError::Network(msg));
        }
        response.data.ok_or_else(|| AppError::Network("Empty API response".into()))
    }

    async fn refresh_token(&self) -> Result<()> {
        let refresh_token = self.tokens.read().await
            .as_ref()
            .map(|t| t.refresh_token.clone())
            .ok_or_else(|| AppError::Auth("No refresh token".into()))?;
        
        let body = serde_json::json!({
            "query": "mutation RefreshToken($token: String!) { refreshToken(token: $token) { accessToken refreshToken expiresAt } }",
            "variables": { "token": refresh_token }
        });

        let response = self.client.post(&format!("{}/graphql", self.base_url))
            .json(&body)
            .send()
            .await?;

        #[derive(Deserialize)]
        struct RefreshData { refreshToken: TokenResponse }
        #[derive(Deserialize)]
        struct TokenResponse { accessToken: String, refreshToken: String, expiresAt: i64 }

        let gql: GraphQLResponse<RefreshData> = response.json().await?;
        let data = self.extract_data(gql)?;
        
        let new_tokens = AuthTokens {
            access_token: data.refreshToken.accessToken,
            refresh_token: data.refreshToken.refreshToken,
            expires_at: data.refreshToken.expiresAt,
        };
        
        *self.tokens.write().await = Some(new_tokens);
        Ok(())
    }

    /// Login with email/password
    pub async fn login(&self, email: &str, password: &str) -> Result<(ApiUser, AuthTokens)> {
        #[derive(Deserialize)]
        struct LoginData { login: LoginResponse }
        #[derive(Deserialize)]
        struct LoginResponse { user: ApiUser, tokens: TokenFields }
        #[derive(Deserialize)]
        struct TokenFields { accessToken: String, refreshToken: String, expiresAt: i64 }

        let query = r#"
            mutation Login($email: String!, $password: String!) {
                login(email: $email, password: $password) {
                    user { id email subscription { plan expiresAt isActive } }
                    tokens { accessToken refreshToken expiresAt }
                }
            }
        "#;

        let vars = serde_json::json!({ "email": email, "password": password });
        let data: LoginData = self.graphql_request(query, Some(vars)).await?;
        
        let tokens = AuthTokens {
            access_token: data.login.tokens.accessToken,
            refresh_token: data.login.tokens.refreshToken,
            expires_at: data.login.tokens.expiresAt,
        };
        
        self.set_tokens(tokens.clone()).await;
        Ok((data.login.user, tokens))
    }

    /// Sign up new account
    pub async fn signup(&self, email: &str, password: &str) -> Result<(ApiUser, AuthTokens)> {
        #[derive(Deserialize)]
        struct SignupData { signup: SignupResponse }
        #[derive(Deserialize)]
        struct SignupResponse { user: ApiUser, tokens: TokenFields }
        #[derive(Deserialize)]
        struct TokenFields { accessToken: String, refreshToken: String, expiresAt: i64 }

        let query = r#"
            mutation Signup($email: String!, $password: String!) {
                signup(email: $email, password: $password) {
                    user { id email subscription { plan expiresAt isActive } }
                    tokens { accessToken refreshToken expiresAt }
                }
            }
        "#;

        let vars = serde_json::json!({ "email": email, "password": password });
        let data: SignupData = self.graphql_request(query, Some(vars)).await?;
        
        let tokens = AuthTokens {
            access_token: data.signup.tokens.accessToken,
            refresh_token: data.signup.tokens.refreshToken,
            expires_at: data.signup.tokens.expiresAt,
        };
        
        self.set_tokens(tokens.clone()).await;
        Ok((data.signup.user, tokens))
    }

    /// Fetch server list
    pub async fn fetch_servers(&self) -> Result<Vec<ApiServer>> {
        #[derive(Deserialize)]
        struct ServersData { servers: Vec<ApiServer> }

        let query = r#"
            query GetServers {
                servers {
                    id name country countryCode city lat lng
                    hostname ip port publicKey
                    supportedProtocols features load isPremium
                }
            }
        "#;

        let data: ServersData = self.graphql_request(query, None).await?;
        Ok(data.servers)
    }

    /// Get current IP info
    pub async fn get_ip_info(&self) -> Result<IpInfoResponse> {
        // Use ipinfo.io as a real IP info source
        let response = self.client.get("https://ipinfo.io/json")
            .send()
            .await?;
        let info: IpInfoResponse = response.json().await?;
        Ok(info)
    }
}

#[derive(Debug, Deserialize, Serialize)]
pub struct IpInfoResponse {
    pub ip: String,
    #[serde(default)]
    pub city: String,
    #[serde(default)]
    pub region: String,
    #[serde(default)]
    pub country: String,
    #[serde(default)]
    pub org: String,
}