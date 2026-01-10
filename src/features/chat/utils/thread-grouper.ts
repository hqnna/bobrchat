type ThreadWithDate = {
  id: string;
  title: string;
  lastMessageAt: Date | null;
  [key: string]: unknown;
};

export type GroupedThreads = {
  today: ThreadWithDate[];
  last7Days: ThreadWithDate[];
  last30Days: ThreadWithDate[];
  older: ThreadWithDate[];
};

export function groupThreadsByDate(threads: ThreadWithDate[]): GroupedThreads {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const sevenDaysAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
  const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

  const grouped: GroupedThreads = {
    today: [],
    last7Days: [],
    last30Days: [],
    older: [],
  };

  threads.forEach((thread) => {
    if (!thread.lastMessageAt) {
      grouped.older.push(thread);
      return;
    }

    const threadDate = new Date(
      thread.lastMessageAt.getFullYear(),
      thread.lastMessageAt.getMonth(),
      thread.lastMessageAt.getDate(),
    );

    if (threadDate.getTime() === today.getTime()) {
      grouped.today.push(thread);
    }
    else if (threadDate > sevenDaysAgo) {
      grouped.last7Days.push(thread);
    }
    else if (threadDate > thirtyDaysAgo) {
      grouped.last30Days.push(thread);
    }
    else {
      grouped.older.push(thread);
    }
  });

  return grouped;
}
