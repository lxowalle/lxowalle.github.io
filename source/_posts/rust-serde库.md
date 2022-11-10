# Rust序列化/反序列化框架

[Rust 序列化反序列框架 Serde](https://www.rectcircle.cn/posts/rust-serde/)

- 对JSON进行序列化和反序列化

  ```c
  // Cargo.toml添加依赖
  serde = { version = "1.0", features = ["derive"] }
  serde_json = "1.0"
      
  // main.rs
  use serde::{Serialize, Deserialize};
  use serde_json;
  
  #[derive(Serialize, Deserialize)]
  struct Color {
      r: u8,
      g: u8,
      b: u8
  }
  
  fn main(){
      let data = r#"
          {
              "r": 31,
              "g": 43,
              "b": 12
          }"#;
  
      // 解析字符串到Person对象。
      let p: Color = serde_json::from_str(data).unwrap();
      println!("Color: {} {} {}", p.r, p.g, p.b);
      
      // Person对象转为JSON字符串.
      let serialized = serde_json::to_string(&p).unwrap();
      println!("serialized = {}", serialized);
  }
  ```