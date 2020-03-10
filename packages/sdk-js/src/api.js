import graphql from "./graphql";

export const signup = async ({ email, password }) => {
  const query = `
    mutation CreateCustomerMutation($customer: CustomerInput!) {
        createCustomer(customer: $customer) {
            token
        }
    }
  `;

  return await graphql({
    query,
    variables: {
      customer: {
        firstname: "Anonymous",
        lastname: "Customer",
        email: email,
        password: password
      }
    }
  });
};

export const signin = async ({ email, password }) => {
  const query = `
      mutation LoginMutation($email: String!, $password: String!) {
          login(email: $email, password: $password) {
              token
          }
      }
    `;

  return await graphql({
    query,
    variables: {
      customer: {
        email: email,
        password: password
      }
    }
  });
};

// pick a plan for current customer
export const pickPlan = async ({ plan, processor, authToken }) => {
  const query = `
        mutation SubscriptionMutation($subscription: SubscriptionCustInput!) {
            createSubscriptionCust(subscription: $subscription) {
                url
            }
        }
      `;

  return await graphql({
    query,
    authToken,
    variables: {
      subscription: {
        plan,
        processor
      }
    }
  });
};

// return true or false if the customer have an active service
export const isActiveService = async ({ authToken }) => {
  const query = `
    mutation ServiceMutation {
        service {
            id
        }
    }
  `;

  const getActiveService = await graphql({
    query,
    authToken
  });

  if (
    getActiveService &&
    getActiveService.result &&
    getActiveService.result.service &&
    getActiveService.result.service.id
  ) {
    return true;
  }

  return false;
};
