#![allow(unused_imports, unused_variables)]
extern crate actix_web;
extern crate actix;
use actix::prelude::*;
use actix_web::*;

use std::sync::RwLock;
use std::sync::Arc;

extern crate serde;
extern crate serde_json;

#[macro_use]
extern crate serde_derive;

use serde_json::{Value, Error};
use std::collections::HashMap;

/// Define http actor
struct Ws {
    client_id: usize,
}

impl Ws {
    fn new() -> Ws {
        Ws {
            client_id: 0,
        }
    }
}

impl Actor for Ws {
    type Context = ws::WebsocketContext<Self, Arc<RwLock<AppState>>>;
}

/// Handler for ws::Message message
impl StreamHandler<ws::Message, ws::ProtocolError> for Ws {

    fn handle(&mut self, msg: ws::Message, ctx: &mut Self::Context) {
        println!("{:?}", msg);
        match msg {
            ws::Message::Ping(msg) => ctx.pong(&msg),
            ws::Message::Text(text) => {
                ctx.state().write().unwrap().send_to_all(
                    self.client_id, serde_json::from_str(&text).unwrap()
                )
            },
            ws::Message::Binary(bin) => ctx.binary(bin),
            _ => (),
        }
    }

    fn started(&mut self, ctx: &mut Self::Context) {
        ctx.state().write().unwrap().new_client(&mut self.client_id, ctx.address());

        println!("connection opened");
    }

    fn finished(&mut self, ctx: &mut Self::Context) {
        ctx.state().write().unwrap().remove_client(self.client_id);
        
    }
}

#[derive(Debug,Message,Serialize, Deserialize)]
struct RelayedMessage {
    client_id: usize,
    msg: serde_json::Value,
}

impl Handler<RelayedMessage> for Ws {
    type Result = ();
    fn handle(&mut self, msg: RelayedMessage, ctx: &mut Self::Context) {
        ctx.text(serde_json::to_string(&msg).unwrap());
    }

}

// This struct represents state
#[derive(Clone)]
struct AppState {
    clients: HashMap<usize,Addr<Ws>>,
    next_index: usize

}
impl AppState {
    pub fn new() -> AppState {
        AppState {
            clients: HashMap::new(),
            next_index: 1,
        }
    }

    pub fn send_to_all(&self, client_id: usize, msg: serde_json::Value) {
        println!("send_to_all: {:}", msg);

        for (_, addr) in self.clients.iter() {
            addr.do_send(RelayedMessage {
                    client_id: client_id, 
                    msg: msg.clone()
            });
        }
    }

    pub fn new_client(&mut self, client_id: &mut usize, address: Addr<Ws>) {
        while self.clients.contains_key(&self.next_index) {
            self.next_index += 1;
        }
        *client_id = self.next_index;
        self.clients.insert(self.next_index, address);
    }

    pub fn remove_client(&mut self, client_id: usize) {
        self.clients.remove(&client_id);
        println!("connection closed");
    }
}

fn main() {
    let app_state = Arc::new(RwLock::new(AppState::new()));

    let yarn_process = std::process::Command::new("yarn")
            .current_dir("./client")
            .args(&["start"]).spawn().unwrap();

    server::new(move || {
        App::with_state(app_state.clone())
        .resource("/api/ws", |r| r.f(|req| ws::start(req, Ws::new())))
    }).bind("127.0.0.1:8080")
        .unwrap()
        .run();

}