import { assertEquals } from "jsr:@std/assert@^1.0.0";
import { relativeTime } from "./relative_time.ts";

Deno.test("relativeTime", async (t) => {
  await t.step("returns 'just now' for times less than a minute ago", () => {
    const now = new Date();
    const times = [
      new Date(now.getTime()),
      new Date(now.getTime() - 1000), // 1 second ago
      new Date(now.getTime() - 30000), // 30 seconds ago
      new Date(now.getTime() - 59000), // 59 seconds ago
    ];

    for (const time of times) {
      assertEquals(relativeTime(time, now), "just now");
    }
  });

  await t.step("returns minutes for times less than an hour ago", () => {
    const now = new Date();
    assertEquals(
      relativeTime(new Date(now.getTime() - 60000), now),
      "1 minute ago",
    );
    assertEquals(
      relativeTime(new Date(now.getTime() - 120000), now),
      "2 minutes ago",
    );
    assertEquals(
      relativeTime(new Date(now.getTime() - 1800000), now),
      "30 minutes ago",
    );
    assertEquals(
      relativeTime(new Date(now.getTime() - 3540000), now),
      "59 minutes ago",
    );
  });

  await t.step("returns hours for times less than a day ago", () => {
    const now = new Date();
    assertEquals(
      relativeTime(new Date(now.getTime() - 3600000), now),
      "1 hour ago",
    );
    assertEquals(
      relativeTime(new Date(now.getTime() - 7200000), now),
      "2 hours ago",
    );
    assertEquals(
      relativeTime(new Date(now.getTime() - 43200000), now),
      "12 hours ago",
    );
    assertEquals(
      relativeTime(new Date(now.getTime() - 82800000), now),
      "23 hours ago",
    );
  });

  await t.step("returns days for times less than a week ago", () => {
    const now = new Date();
    assertEquals(
      relativeTime(new Date(now.getTime() - 86400000), now),
      "1 day ago",
    );
    assertEquals(
      relativeTime(new Date(now.getTime() - 172800000), now),
      "2 days ago",
    );
    assertEquals(
      relativeTime(new Date(now.getTime() - 518400000), now),
      "6 days ago",
    );
  });

  await t.step("returns weeks for times less than a month ago", () => {
    const now = new Date();
    assertEquals(
      relativeTime(new Date(now.getTime() - 604800000), now),
      "1 week ago",
    );
    assertEquals(
      relativeTime(new Date(now.getTime() - 1209600000), now),
      "2 weeks ago",
    );
    assertEquals(
      relativeTime(new Date(now.getTime() - 2419200000), now),
      "4 weeks ago",
    );
  });

  await t.step("returns months for times less than a year ago", () => {
    // Use a fixed base date (mid-month) to avoid EOM/DST issues
    const now = new Date("2024-06-15T12:00:00Z");
    const oneMonthAgo = new Date("2024-05-15T12:00:00Z");
    assertEquals(relativeTime(oneMonthAgo, now), "1 month ago");

    const twoMonthsAgo = new Date("2024-04-15T12:00:00Z");
    assertEquals(relativeTime(twoMonthsAgo, now), "2 months ago");

    const elevenMonthsAgo = new Date("2023-07-15T12:00:00Z");
    assertEquals(relativeTime(elevenMonthsAgo, now), "11 months ago");
  });

  await t.step("returns years for times more than a year ago", () => {
    const now = new Date();
    const oneYearAgo = new Date(now);
    oneYearAgo.setFullYear(now.getFullYear() - 1);
    assertEquals(relativeTime(oneYearAgo, now), "1 year ago");

    const twoYearsAgo = new Date(now);
    twoYearsAgo.setFullYear(now.getFullYear() - 2);
    assertEquals(relativeTime(twoYearsAgo, now), "2 years ago");

    const tenYearsAgo = new Date(now);
    tenYearsAgo.setFullYear(now.getFullYear() - 10);
    assertEquals(relativeTime(tenYearsAgo, now), "10 years ago");
  });

  await t.step("handles future times", () => {
    const now = new Date();
    assertEquals(
      relativeTime(new Date(now.getTime() + 60000), now),
      "in 1 minute",
    );
    assertEquals(
      relativeTime(new Date(now.getTime() + 3600000), now),
      "in 1 hour",
    );
    assertEquals(
      relativeTime(new Date(now.getTime() + 86400000), now),
      "in 1 day",
    );
  });

  await t.step("uses current time when base is not provided", () => {
    const result = relativeTime(new Date());
    assertEquals(result, "just now");
  });

  await t.step("handles edge cases correctly", () => {
    const now = new Date();
    // Exactly 1 minute
    assertEquals(
      relativeTime(new Date(now.getTime() - 60000), now),
      "1 minute ago",
    );
    // Just under 1 minute
    assertEquals(
      relativeTime(new Date(now.getTime() - 59999), now),
      "just now",
    );
    // Exactly 1 hour
    assertEquals(
      relativeTime(new Date(now.getTime() - 3600000), now),
      "1 hour ago",
    );
    // Just under 1 hour
    assertEquals(
      relativeTime(new Date(now.getTime() - 3599999), now),
      "59 minutes ago",
    );
  });

  await t.step("handles singular vs plural correctly", () => {
    const now = new Date();
    assertEquals(
      relativeTime(new Date(now.getTime() - 60000), now),
      "1 minute ago",
    );
    assertEquals(
      relativeTime(new Date(now.getTime() - 120000), now),
      "2 minutes ago",
    );
    assertEquals(
      relativeTime(new Date(now.getTime() + 60000), now),
      "in 1 minute",
    );
    assertEquals(
      relativeTime(new Date(now.getTime() + 120000), now),
      "in 2 minutes",
    );
  });
});
