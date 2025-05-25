use linera_sdk::views::{linera_views, RegisterView, RootView, ViewStorageContext};

#[derive(RootView, async_graphql::SimpleObject)]
#[view(context = "ViewStorageContext")]
pub struct FlappyState {
    pub value: RegisterView<u64>,
    pub best: RegisterView<u64>,
    // Add fields here.
}
