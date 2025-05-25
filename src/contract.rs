#![cfg_attr(target_arch = "wasm32", no_main)]

mod state;

use linera_sdk::{
    linera_base_types::WithContractAbi,
    views::{RootView, View},
    Contract, ContractRuntime,
};

use flappy::Operation;

use self::state::FlappyState;

pub struct FlappyContract {
    state: FlappyState,
    runtime: ContractRuntime<Self>,
}

linera_sdk::contract!(FlappyContract);

impl WithContractAbi for FlappyContract {
    type Abi = flappy::FlappyAbi;
}

impl Contract for FlappyContract {
    type Message = ();
    type Parameters = ();
    type InstantiationArgument = u64;
    type EventValue = ();

    async fn load(runtime: ContractRuntime<Self>) -> Self {
        let state = FlappyState::load(runtime.root_view_storage_context())
            .await
            .expect("Failed to load state");
        FlappyContract { state, runtime }
    }

    async fn instantiate(&mut self, argument: Self::InstantiationArgument) {
        // validate that the application parameters were configured correctly.
        self.runtime.application_parameters();
        self.state.value.set(argument);
    }

    async fn execute_operation(&mut self, operation: Self::Operation) -> Self::Response {
        match operation {
            Operation::Increment { value } => {
                self.state.value.set(self.state.value.get() + value);
            }

            Operation::SetBest {} => {
                let current = *self.state.value.get();
                let best = *self.state.best.get();
                if current > best {
                    self.state.best.set(current);
                }
                self.state.value.set(0)
            }
        }
    }

    async fn execute_message(&mut self, _message: Self::Message) {}

    async fn store(mut self) {
        self.state.save().await.expect("Failed to save state");
    }
}
