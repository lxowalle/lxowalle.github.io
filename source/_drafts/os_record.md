# OS record



07-13

---

- [ ] 俯瞰已完成的功能点

- [ ] 整理多道程序与分时多任务涉及的功能点

    - [ ] 多道程序的放置与加载
    - [ ] 任务切换（跟目前实现的有区别，需要改进）
        - [ ] 实现用户任务间的切换，内核和用户任务的切换

    - [ ] 通过协作机制支持程序主动放弃处理器，提高系统执行效率
        - [ ] 实现任务管理器，任务控制块，任务运行状态
        - [ ] 实现sys_yield系统调用，sys_exit系统调用
        - [ ] 内核态切换到用户态
    - [ ] 通过抢占机制支持程序被动放弃处理器，提高不同程序对处理器资源使用的公平性，也进一步提高了应用对 I/O 事件的响应效率
        - [ ] 实现定时器中断
        - [ ] 实现抢占式调度

- [ ] 设计完成多道程序与分时多任务