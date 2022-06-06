# rust-core库

参考[rust官方core文档](https://doc.rust-lang.org/core/)V1.61.0版

​	rust有两个基本库，core库和std库，其中std库依赖于core库，core库没有依赖，一般作为rust代码跨平台的基础库。所以嵌入式开发过程一般都会使用#![no_std]来屏蔽掉std库，而只是用core库开发。

​	core库分为原始类型、模块和宏。

## 原始类型

注：rust官方手册标记了`Experimental`的都表示不稳定状态，表示该类型/模块在未来是有可能更改甚至删除。

### never

编程时写为`!`的符号又称为nerver类型。`!`类型用来表示某个数值不会被解释为任何计算类型。

默认trait：

1. Clone
2. Debug

注意事项：

1. 支持`!`类型的表达式可以强制转换为任何其他类型，包括有break、continue和return
2. 使用`Result<T, !>`可以表示该Result没有错误发生，使用`Result<!, T>`可以表示该Result必定有错误发生
3. 对于非`!`类型的函数，如果使用`!`类型返回，则必须保证返回类型可以被自动推导出来，否则编译器不能确定`!`需要强制转换的正确类型。

### array

array是数组类型，表示为[T; N]，其中T表示类型，N表示非负常量。

有两种创建数组的方式

- 使用[x,y,z]的方式创建
- 使用[x; N]的方式创建，但是值x必须定义了Copy 

注意：

1. 对于元素数量为0~32的数组，如果元素类型允许，数据将会实现Default trait。
2. 数组可以强制为slice，因此可以直接使用slice的方法

使用方法：

1. 初始化、赋值、取值

   ```rust
   // 初始化
   let mut array: [i32; 3] = [0; 3];
   // 赋值
   array[0] = 1;
   array[1] = 2;
   array[2] = 3;
   // 取值
   for i in array {
   	println!("{}", array[i]);
   }
   
   // 取值，注意这里的i是array每个元素的指针
   println!("&array:{}", &array as *const i32 as usize);
   for i in &array {
       unsafe{println!("i:{} ptr_for_i:{}", i, i as *const i32 as usize);}
   }
   ```

2. 切片模式取值

   ```rust
   // 切片模式取值1
   let array: [i32; 5] = [1, 2, 3, 4, 5];
   match array[1..4] {
       [a, _] => println!("Error, too short"),
       [a, b, c] => println!("Ok,a:{} b:{}, c:{}", a, b, c),
       _  => println!("None"),
   };
   // 切片模式取值2
   let [a, b, c] = [1, 2, 3];
   println!("a:{}", a);
   println!("b:{}", b);
   println!("c:{}", c);
   ```

3. 迭代取值

   ```rust
   // 取引用迭代
   let array: [i32; 5] = [1, 2, 3, 4, 5];
   for item in array.iter().enumerate() {
       let (i, val): (usize, &i32) = item;
       println!("i:{} val:{}", i, val);
   }
   // 取值迭代
   let array: [i32; 5] = [1, 2, 3, 4, 5];
   for item in IntoIterator::into_iter(array).enumerate() {
       let (i, val): (usize, i32) = item;
       println!("i:{} val:{}", i, val);
   }
   ```

函数：

1. map函数

   map函数用来从一个数组生成一个新的数组。map在大数组上优化不够好，因此需要避免在大数组中使用map

   ```rust
   // 将数组所有值加1并保存
   let array: [i32; 5] = [1, 2, 3, 4, 5];
   let tmp = 3;
   let new_array = array.map(|v| {v + tmp});
   println!("{:?}", new_array);
   ```

2. try_map函数

   try_map函数功能类似map函数，从一个数组来生成一个新数组时会检查是否有Error并返回错误，错误类型可能是Result<[T;N];E>或Option<T>，由闭包的返回类型决定。

   try_map函数可以

   ```rust
   #![feature(array_try_map)]
   // 将数组内容从&str转换为u32并保存为一个新的array
   let a = ["1", "2", "3"];
   let b = a.try_map(|v| v.parse::<u32>()).unwrap().map(|v| v + 1);
   println!("{:?}", b);
   ```

3. zip函数

   zip函数会将两个数组的值合并为一个元组。

   ```rust
   let x = [1, 2, 3];
   let y = [4, 5, 6];
   let z = x.zip(y);
   println!("{:?}", z);
   ```

4. as_slice函数

   as_slice函数将数组转换为包含整个数组的切片，等效于&s[..]

5. as_mut_slice函数

   

## 常用Trait

### Clone

rust中实现了Clone Trait的类型可以进行深拷贝，但需要显示调用。Clone主要实现一个clone函数。

### Copy

参考[这里](https://doc.rust-lang.org/core/marker/trait.Copy.html)

rust中值传递过程默认隐式使用Move传递，意味着值传递时生命周期也一起传递，而实现了Copy trait后会默认隐式使用Copy传递，目标值将进行浅拷贝但不会有生命周期传递。

注意：

1. 由于Copy trait定义时依赖了Clone trait，因此想要实现Copy，则必须实现Clone
2. 不能同时实现Copy trait和Drop trait

### Drop

Drop主要实现一个drop函数，当某个所有者变量离开作用域时会调用该方法。

### Default

Default用来定义一个变量的默认值。

```rust
#[device(Debug)]
struct Test {
    enable: bool,
}
impl Default for Test {
    fn default() -> Self {
        Test {
            enable: true,
        }
    }
}

fn main() {
    let td = Test::default();
    println!("{:?}", td);
}
```

### Debug

对于一些复合类型，需要实现Debug trait才能直接被打印出来。一般情况使用`#[device(Debug)]`直接定义Debug trait。如果想要自定义的显示，则可以手动实现Debug或Display的fmt函数来自定义打印输出。

### Display

对于一些复合类型，如果想要自定义打印格式，则可以实现Display trait的fmt方法。

```rust
struct test {
    x: f64,
    y: f64,
}

impl Display for test {
    fn fmt(&self, f: &mut Formatter) -> Result {
        write!(f, "Display: {} + {}", self.x, self.y)
    }
}
```

### From

From trait通过编写from函数来定义从一种类型生成自己的过程。

```rust
use std::convert::From;

#[derive(Debug)]
struct Number {
    value: i32,
}

impl From<i32> for Number {
    fn from(item: i32) -> Self {
        Number { value: item }
    }
}

fn main() {
    let num = Number::from(30);
    println!("My number is {:?}", num);
}

```

### Into

Into trait就是把From trait倒过来，只要实现了From trait，Into trait也会被实现。

```rust
use std::convert::From;

#[derive(Debug)]
struct Number {
    value: i32,
}

impl From<i32> for Number {
    fn from(item: i32) -> Self {
        Number { value: item }
    }
}

fn main() {
    let int = 5;
    let num: Number = int.into();		// 注意:这里定义num时需要指明类型为Number
    println!("My number is {:?}", num);
}
```

### Hash

Hash trait 可以实例化一个任意大小的类型，并且能够用哈希（hash）函数将该实例映射到一个固定大小的值上。

### PartialEq

PartialEq trait通过实现eq函数来实现==和!=的功能。

### Eq

Eq trait依赖于PartialEq的功能，且不需要实现。为数据实现Eq trait表明了该数据具有自反性，也就是自己等于自己。对于浮点类型不能实现Eq trait，因为Nan != Nan ?????

Hash trait也会依赖Eq trait的特性。

### PartialOrd

PartialOrd trait通过实现partial_cmp方法来实现> >= < <=的功能，依赖于PartialEq方法。

```rust
use std::cmp::Ordering;

#[derive(Eq)]
struct Person {
    id: u32,
    name: String,
    height: u32,
}

impl PartialOrd for Person {
    fn partial_cmp(&self, other: &Self) -> Option<Ordering> {
        Some(self.cmp(other))
    }
}

impl PartialEq for Person {
    fn eq(&self, other: &Self) -> bool {
        self.height == other.height
    }
}
```

### Ord

Ord trait可以指定数据结构上任意两个值存在的有效顺序，依赖于PartialOrd trait和Eq trait

```rust
use std::cmp::Ordering;

#[derive(Eq)]
struct Person {
    id: u32,
    name: String,
    height: u32,
}

impl Ord for Person {
    fn cmp(&self, other: &Self) -> Ordering {
        self.height.cmp(&other.height)
    }
}

impl PartialOrd for Person {
    fn partial_cmp(&self, other: &Self) -> Option<Ordering> {
        Some(self.cmp(other))
    }
}

impl PartialEq for Person {
    fn eq(&self, other: &Self) -> bool {
        self.height == other.height
    }
}

```

### IntoIterator

IntoIterator trait通过定义into_iter函数来定义如何转换为迭代器。

### AsRef

AsRef trait通过定义as_ref函数来获取目标的引用。

### AsMut

AsMut trait通过定义as_mut函数来获取目标的可变引用

### Borrow

Borrow tarit通过定义borrow函数来获取目标的借用，Borrow和AsRef相比很相似但更加严格，如果类型U实现了Borrow<T>，在为U实现额外的trait(特别是实现Eq, Ord, Hash)的时候应该实现与T相同的行为。

### BorrowMut

Borow trait通过定义borrow_mut函数来获取目标的可变借用，BorrowMut依赖于Borrow。

### ToOwned

ToOwned trait允许类型&U到T的转换。
