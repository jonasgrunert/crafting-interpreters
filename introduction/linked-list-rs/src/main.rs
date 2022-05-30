use std::mem;

struct List {
    length: u128,
    head: Option<Box<Node>>,
    //end: Option<Node<'a>>
}

impl List {
    pub fn new() -> Self {
        List{length: 0, head: None}
    }

    pub fn unshift(&mut self, value: String) -> &u128 {
        self.head = Some(Box::new(Node {value, next: self.head.take()}));
        self.length+=1;
        &self.length
    }

    pub fn shift(&mut self) -> Option<String> {
        self.head.take().map(|node| {
            self.head = node.next;
            node.value
        })
    }
}

struct Node {
    next: Option<Box<Node>>,
    value: String
}

fn main() {
    println!("Hello, world!");
}
