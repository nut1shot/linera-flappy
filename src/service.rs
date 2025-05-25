#![cfg_attr(target_arch = "wasm32", no_main)]

mod state;

use std::sync::Arc;

use async_graphql::{EmptySubscription, Object, Schema};
use linera_sdk::{
    graphql::GraphQLMutationRoot, linera_base_types::WithServiceAbi, views::View, Service,
    ServiceRuntime,
};

use flappy::Operation;

use self::state::FlappyState;

pub struct FlappyService {
    state: FlappyState,
    runtime: Arc<ServiceRuntime<Self>>,
}

linera_sdk::service!(FlappyService);

impl WithServiceAbi for FlappyService {
    type Abi = flappy::FlappyAbi;
}

impl Service for FlappyService {
    type Parameters = ();

    async fn new(runtime: ServiceRuntime<Self>) -> Self {
        let state = FlappyState::load(runtime.root_view_storage_context())
            .await
            .expect("Failed to load state");
        FlappyService {
            state,
            runtime: Arc::new(runtime),
        }
    }

    async fn handle_query(&self, query: Self::Query) -> Self::QueryResponse {
        Schema::build(
            QueryRoot {
                value: *self.state.value.get(),
                best: *self.state.best.get(),
            },
            Operation::mutation_root(self.runtime.clone()),
            EmptySubscription,
        )
        .finish()
        .execute(query)
        .await
    }
}

struct QueryRoot {
    value: u64,
    best: u64,
}

#[Object]
impl QueryRoot {
    async fn value(&self) -> &u64 {
        &self.value
    }

    async fn best(&self) -> &u64 {
        &self.best
    }
}
