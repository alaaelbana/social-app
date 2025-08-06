import RecentUsersClient from "./RecentUsersClient";

async function getRecentUsers() {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL}/api/users/recent`,
      { cache: "no-store" }
    );
    if (!response.ok) throw new Error("Failed to fetch recent users");
    const data = await response.json();
    return data.users;
  } catch (error) {
    console.error("Error fetching recent users:", error);
    return [];
  }
}

export default async function RecentUsers() {
  const users = await getRecentUsers();

  return <RecentUsersClient users={users} />;
}
