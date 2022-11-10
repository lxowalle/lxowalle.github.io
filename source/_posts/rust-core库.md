# rust-core库

参考[rust官方core文档](https://doc.rust-lang.org/core/)V1.61.0版

参考[rust core文档](https://rust.ffactory.org/core/index.html)V1.60.0版

参考[Rust trait指南](https://rustmagazine.github.io/rust_magazine_2021/chapter_7/rusts-standard-library-traits.html)

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

#### 使用方法

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

#### 函数

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

   as_mut_slice函数将数组转换为包含整个数组的可变切片，等效于mut &s[..]
   
6. each_ref函数

   each_ref函数用来借用每个元素并返回大小相同的引用数组。注意返回的数组的每个成员都是原数组成员的引用。

   ```rust
   #![feature(array_methods)]
   fn main() {
       println!("Hello world!");
       let floats = [3.1, 2.7, -1.0];
       let float_refs: [&f64; 3] = floats.each_ref();
       println!("{:?} {:?} {:?} {:?}", &floats as *const f64 as usize, 
                           float_refs[0] as *const f64 as usize,
                           float_refs[1] as *const f64 as usize,
                           float_refs[2] as *const f64 as usize);
       println!("{:?} {:?}", floats, float_refs);
   }
   ```

7. mut_ref函数

   each_ref函数用来借用每个元素并返回大小相同的可变引用数组。注意返回的数组的每个成员都是原数组成员的可变引用。

8. split_array_ref函数

   split_array_ref函数会在索引M的位置将数组分为[0, M)和[M, N)两部分，N表示数组最大长度。如果M>N将会触发panic。

   split_array_ref函数通过元组返回两个新数组的引用。

   ```rust
   #![feature(split_array)]
   fn main() {
       let v = [1, 2, 3, 4, 5, 6];
       {
          let (left, right) = v.split_array_ref::<0>();
          assert_eq!(left, &[]);
          assert_eq!(right, &[1, 2, 3, 4, 5, 6]);
       }
       
       {
           let (left, right) = v.split_array_ref::<2>();
           assert_eq!(left, &[1, 2]);
           assert_eq!(right, &[3, 4, 5, 6]);
           println!("array:{:?} left:{:?}  right:{:?}", 
           &v as *const i32 as usize, 
           left as *const i32 as usize,
           &right[0] as *const i32 as usize);
       }
       
       {
           let (left, right) = v.split_array_ref::<6>();
           assert_eq!(left, &[1, 2, 3, 4, 5, 6]);
           assert_eq!(right, &[]);
       }
   }
   ```

9. split_array_mut函数

   同split_array_ref函数，生成的两个数组引用为可变引用。

10. rsplit_array_ref函数

    rsplit_array_ref函数会在索引M的位置将数组分为[0, N-M)和[N-M, N)两部分，N表示数组最大长度。如果M>N将会触发panic。

    split_array_ref函数通过元组返回两个新数组的引用。

    ```rust
    #![feature(split_array)]
    fn main() {
        let v = [1, 2, 3, 4, 5, 6];
    
        {
           let (left, right) = v.rsplit_array_ref::<0>();
           assert_eq!(left, &[1, 2, 3, 4, 5, 6]);
           assert_eq!(right, &[]);
        }
        
        {
            let (left, right) = v.rsplit_array_ref::<2>();
            assert_eq!(left, &[1, 2, 3, 4]);
            assert_eq!(right, &[5, 6]);
        }
        
        {
            let (left, right) = v.rsplit_array_ref::<6>();
            assert_eq!(left, &[]);
            assert_eq!(right, &[1, 2, 3, 4, 5, 6]);
        }
    }
    ```

11. rssplit_array_mut函数

    同rssplit_array_mut函数，生成的两个数组引用为可变引用。

#### 已实现的Trait

见手册

### Bool

bool表示布尔类型，只能是true或flase，转换整数为0和1

#### 使用方法

```rust
let test = true;

// using the `if` conditional
if test {
    println!("oh, yeah!");
} else {
    println!("what?!!");
}

// ... or, a match pattern
match test {
    true => println!("keep praising!"),
    false => println!("you should praise!"),
}
```

#### 函数

1. then_some函数

   then_some函数通过判断一个布尔类型，并返回Option类型

   ```rust
   fn main() {
       assert_eq!(false.then_some(0), None);
       assert_eq!(true.then_some(5), Some(5));
   }
   ```

2. then函数

   then函数通过判断一个布尔类型，如果为true则返回Some(f()),如果为false则返回None

   ```rust
   fn main() {
       assert_eq!(false.then(|| 0), None);
       assert_eq!(true.then(|| 5), Some(5));
   }
   ```

### char

char是字符类型，范围是Unicode除了代理代码点以外的代码点，包括[0,0x10FFFF]，UTF-16使用的代理代码点在0xD800到0xDFFF的范围。

#### 使用方式

1. 创建

   ```rust
   fn main() {
       println!("{:?}", char::from_u32(0x61));
       println!("{:?}", unsafe{char::from_u32_unchecked(0x61)});
       let char = 'a';
       println!("{:?}", char);
   }
   ```


#### 函数

1.  MAX、REPLACEMENT_CHARACTER、UNICODE_VERSION变量

   ```rust
   fn main() {
       println!("{:?}", char::MAX);					// char最大有效码点
       println!("{:?}", char::REPLACEMENT_CHARACTER);	// 用来表示char字符错误的字符，一般是�符号
       println!("{:?}", char::UNICODE_VERSION);		// UNICODE版本号
   }
   ```

2. decode_utf16函数

   将utf16进行解码

   ```rust
   fn main() {
       let v = [
           0xD834, 0xDD1E, 0x006d, 0x0075, 0x0073, 0xDD1E, 0x0069, 0x0063, 0xD834,
       ];
   
       assert_eq!(
           char::decode_utf16(v)
               .map(|r| r.map_err(|e| e.unpaired_surrogate()))
               .collect::<Vec<_>>(),
           vec![
               Ok('𝄞'),
               Ok('m'), Ok('u'), Ok('s'),
               Err(0xDD1E),
               Ok('i'), Ok('c'),
               Err(0xD834)
           ]
       ); 
   }
   ```

3. from_u32函数

   从u32类型转换为字符类型。该函数返回Option<char>类型

   ```rust
   fn main() {
       let c = char::from_u32(0x2764);
       assert_eq!(Some('❤'), c);
       assert_eq!(0x2764, c.unwrap() as u32);
   }
   ```

4. from_u32_unchecked函数

   从u32类型转换为字符类型。该函数返回char类型

   ```rust
   fn main() -> () {
       let mut c = 'char::default()';
       unsafe {c = char::from_u32_unchecked(0x2764);}
       assert_eq!('❤', c);
       assert_eq!(0x2764, c as u32);
   }
   ```

5. ....

   更多的函数见手册

### f32

​	f32是32位的浮点类型，与其他语言的浮点类型类似。

​	f32可以表示一些特殊的值：

- -0.0：当比较运算时，-0.0=+0.0；当算数运算时，-0.0和+0.0的符号位将会纳入计算。
- ∞和 -∞：这些结果来自于类似的计算`1.0 / 0.0`。
- NaN(不是数字)：该值不等于浮点数，也不等于自己，因此Ord trait不能作用与浮点数，因为会出现NaN和NaN的比较计算。

### f64

​	f64是64位的浮点类型，与f32功能相似，只是提供了两倍的位数来提高精度。

### fn

​	fn是指向带么而不是数据的指针。fn可以像函数一样被调用，但不能为空。如果需要空函数，可以用Option<Fn>包含。

注意：

1. 函数默认ABI为"Rust"，即`Fn()`类型与`extern "Rust" fn()`相同。也可以使用C ABI，需要写为`extern "C" fn()`
2. 函数的名字已经通过Fn定义时，该名字作为表达式时会变成一个长度为0的唯一标识，并且可以将标识转换为函数指针类型。

#### i8

​	i8是有符号的1字节整数。

#### 函数

1. 常用

   ```rust
   
   fn main() {
       assert_eq!(i8::MAX, 127);                               // i8最大值
       assert_eq!(i8::MIN, -128);                              // i8最小值
       assert_eq!(i8::from_str_radix("1", 10).unwrap(), 1);    // 字符串转i8,基数为10
       assert_eq!(i8::from_str_radix("A", 16).unwrap(), 10);   // 字符串转i8,基数为16
       assert_eq!(i8::count_ones(0b00011001), 3);              // 返回bit为1的个数
       assert_eq!(i8::count_zeros(0b00011001), 5);             // 返回bit为0的个数
       assert_eq!(i8::leading_ones(-1i8), 8);                  // 返回前导1的个数
       assert_eq!(i8::leading_zeros(-1i8), 0);                 // 返回前导0的个数
       assert_eq!(i8::trailing_ones(-1i8), 8);                 // 返回后导1的个数
       assert_eq!(i8::trailing_zeros(-1i8), 0);                // 返回后导0的个数
       assert_eq!(i8::rotate_left(0b1000, 5), 0b0001);         // 循环左移n位，溢出值放到末尾
       assert_eq!(i8::rotate_right(0b10000, 6), 0b01000000);   // 循环右移n位，溢出值放到开头
       assert_eq!(i8::swap_bytes(-2i8), -2i8);                 // 交换数值
       assert_eq!(i8::reverse_bits(0b0010), 0b01000000);       // 大小端格式翻转
       assert_eq!(i8::from_le(1), 1);                          // 从小端格式转换
       assert_eq!(i8::from_be(1), 1);                          // 从大端格式转换
       assert_eq!(i8::to_le(1), 1);                            // 从转换为小端格式
       assert_eq!(i8::to_be(1), 1);                            // 从转换为大端格式   
   }
   ```

   



#### 使用方法：

1. 强制转换普通函数，或者使用闭包

   ```rust
   fn main() -> () {
       fn add_one(x: usize) -> usize {
           x + 1
       }
       let ptr: fn(usize) -> usize = add_one;		// 普通函数转fn
       assert_eq!(ptr(5), 6);
       let clos: fn(usize) -> usize = |x| x + 5;	// 闭包转fn
       assert_eq!(clos(5), 10);
   }
   ```

2. 获取函数标识，以及将函数标识转换为函数指针

   ```rust
   fn main() -> () {
       fn bar(x: i32) {}
   
       let not_bar_ptr = bar; // `not_bar_ptr` 大小为零，唯一标识 `bar`
       assert_eq!(mem::size_of_val(&not_bar_ptr), 0);
       
       let bar_ptr: fn(i32) = not_bar_ptr; // 强制转换为函数指针
       assert_eq!(mem::size_of_val(&bar_ptr), mem::size_of::<usize>());
       
       let footgun = &bar; // 这是对标识 `bar` 的零大小类型的共享引用
   }
   ```

   



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

### Index和IndexMut

Index和IndexMut分别通过实现index和index_mut方法来实现使用[]进行切片操作

```rust
#[derive(Debug)]
struct Any<T> {
    con: Vec<T>,
}

impl<T> std::ops::Index<usize> for Any<T> {
    type Output = [T];
    fn index(&self, index: usize) -> &[T] {
        let start = index;
        &self.con[start..start + 1]
    }
}

impl<T> std::ops::IndexMut<usize> for Any<T> {
    fn index_mut(&mut self, index: usize) -> &mut [T] {
        let start = index * 1;
        &mut self.con[start..start + 1]
    }
}

fn main() {
    let mut a = Any {con: vec!{1, 2, 3, 4, 5, 6} };
    println!("a:{:?} a[0]:{:?}", a, &a[1]);
    assert!(a[0] == [1]);
    
    let b = &mut a[1];
    b[0] = 7;
    println!("b:{:?}", b);
    assert!(b == [7]);
}
```

### Pattern

Pattern trait定义了字符串搜索方法

### Add和AddAssign

Add trait通过实现add函数来实现+功能；AddAssign trait通过实现add_assign函数来实现+=功能

### Div和DivAssign

Div trait通过实现div函数来实现/功能；DivAssign trait通过实现div_assign函数来实现/=功能

### Mul和MulAssign

Mul trait通过实现mul函数来实现*功能；MulAssign trait通过实现mul_assign函数来实现*=功能

### Rem和RemAssign

Rem trait通过实现rem函数来实现%功能；RemAssign trait通过实现rem_assign函数来实现%=功能

### Sub和SubAssign

Sub trait通过实现sub函数来实现-功能；SubAssign trait通过实现sub_assign函数来实现-=功能

### LowerExp

LowerExp trait用来实现格式化时的小写指数形式

### UpperExp

UpperExp trait用来实现格式化时的大写指数形式

### Neg

Neg trait用来实现一元求反的功能

### Product

Product trait通过实现product函数来实现迭代器元素相乘的功能

