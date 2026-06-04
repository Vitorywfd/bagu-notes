export const sampleBankJson = JSON.stringify(
  {
    version: 1,
    exportedAt: new Date("2026-05-27T00:00:00Z").toISOString(),
    chapters: [
      { title: "C语言篇", sort_order: 1 },
      { title: "操作系统篇", sort_order: 2 },
      { title: "网络通信篇", sort_order: 3 },
    ],
    questions: [
      {
        chapterTitle: "C语言篇",
        question: "sizeof 和 strlen 的区别是什么？",
        answer:
          "sizeof 是操作符，编译期计算对象或类型占用的字节数；strlen 是库函数，运行期统计字符串到 `\\0` 之前的字符数。\n\n```c\nchar s[] = \"abc\";\nsizeof(s); // 4\nstrlen(s); // 3\n```",
        sort_order: 1,
      },
      {
        chapterTitle: "操作系统篇",
        question: "进程和线程的区别是什么？",
        answer:
          "进程是资源分配的基本单位，拥有独立地址空间；线程是 CPU 调度的基本单位，同一进程内线程共享进程资源。线程切换通常比进程切换开销更小。",
        sort_order: 1,
      },
      {
        chapterTitle: "网络通信篇",
        question: "TCP 三次握手的目的是什么？",
        answer:
          "三次握手用于确认双方收发能力正常，并同步初始序列号，避免历史连接请求导致错误连接建立。",
        sort_order: 1,
      },
    ],
  },
  null,
  2,
);
