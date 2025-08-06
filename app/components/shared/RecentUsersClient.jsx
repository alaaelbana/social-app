"use client";

export default function RecentUsersClient({ users }) {
  const formatJoinDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    if (diffDays === 1) return "Today";
    if (diffDays === 2) return "Yesterday";
    if (diffDays <= 7) return `${diffDays - 1} days ago`;
    if (diffDays <= 30) return `${Math.ceil(diffDays / 7)} weeks ago`;
    return `${Math.ceil(diffDays / 30)} months ago`;
  };

  const openLink = (url) => {
    if (!url) return;
    // Add https:// if no protocol is specified
    let formattedUrl = url;
    if (!url.startsWith("http://") && !url.startsWith("https://")) {
      formattedUrl = `https://${url}`;
    }
    window.open(formattedUrl, "_blank", "noopener,noreferrer");
  };

  const formatSocialLink = (platform, value) => {
    if (!value) return null;
    switch (platform) {
      case "twitter":
        if (value.startsWith("@")) {
          return `https://twitter.com/${value.slice(1)}`;
        } else if (value.includes("twitter.com") || value.includes("x.com")) {
          return value;
        } else return `https://twitter.com/${value}`;
      case "github":
        if (value.includes("github.com")) return value;
        else return `https://github.com/${value}`;
      case "linkedin":
        if (value.includes("linkedin.com")) return value;
        else return `https://linkedin.com/in/${value}`;
      default:
        return value;
    }
  };

  return (
    <div className="bg-black/20 backdrop-blur-sm rounded-xl p-6 border border-[#8733ff]/20 shadow-lg shadow-[#531db5]/10">
      <h2 className="text-xl font-bold text-white mb-4">New Members</h2>

      {users.length === 0 ? (
        <p className="text-gray-400 text-sm text-center py-4">
          No new members yet
        </p>
      ) : (
        <div className="space-y-4">
          {users.map((user) => (
            <div
              key={user.id}
              className="bg-gray-800/20 rounded-lg p-3 border border-gray-600/30 backdrop-blur-sm hover:bg-gray-800/30 transition-colors"
            >
              <div className="flex items-start space-x-3">
                <img
                  src={user.image}
                  alt={user.name}
                  className="w-10 h-10 rounded-full object-cover flex-shrink-0 border border-[#8733ff]/30"
                />
                <div className="flex-1 min-w-0">
                  <h3 className="text-white font-medium text-sm truncate">
                    {user.name}
                  </h3>
                  <p className="text-gray-400 text-xs mb-2">
                    Joined {formatJoinDate(user.joinedAt)}
                  </p>

                  {/* Social Links */}
                  <div className="flex space-x-2">
                    {user.links.website && (
                      <button
                        onClick={() => openLink(user.links.website)}
                        className="text-gray-400 hover:text-[#8733ff] transition-colors"
                        title="Website"
                      >
                        <svg
                          className="w-4 h-4"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M4.083 9h1.946c.089-1.546.383-2.97.837-4.118A6.004 6.004 0 004.083 9zM10 2a8 8 0 100 16 8 8 0 000-16zm0 2c-.076 0-.232.032-.465.262-.238.234-.497.623-.737 1.182-.389.907-.673 2.142-.766 3.556h3.936c-.093-1.414-.377-2.649-.766-3.556-.24-.559-.499-.948-.737-1.182C10.232 4.032 10.076 4 10 4zm3.971 5c-.089-1.546-.383-2.97-.837-4.118A6.004 6.004 0 0115.917 9h-1.946zm-2.003 2H8.032c.093 1.414.377 2.649.766 3.556.24.559.499.948.737 1.182.233.23.389.262.465.262.076 0 .232-.032.465-.262.238-.234.497-.623.737-1.182.389-.907.673-2.142.766-3.556zm1.166 4.118c.454-1.147.748-2.572.837-4.118h1.946a6.004 6.004 0 01-2.783 4.118zm-6.268 0C6.412 13.97 6.118 12.546 6.03 11H4.083a6.004 6.004 0 002.783 4.118z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </button>
                    )}

                    {user.links.twitter && (
                      <button
                        onClick={() =>
                          openLink(
                            formatSocialLink("twitter", user.links.twitter)
                          )
                        }
                        className="text-gray-400 hover:text-[#1DA1F2] transition-colors"
                        title="Twitter"
                      >
                        <svg
                          className="w-4 h-4"
                          fill="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" />
                        </svg>
                      </button>
                    )}

                    {user.links.linkedin && (
                      <button
                        onClick={() =>
                          openLink(
                            formatSocialLink("linkedin", user.links.linkedin)
                          )
                        }
                        className="text-gray-400 hover:text-[#0077B5] transition-colors"
                        title="LinkedIn"
                      >
                        <svg
                          className="w-4 h-4"
                          fill="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                        </svg>
                      </button>
                    )}

                    {user.links.github && (
                      <button
                        onClick={() =>
                          openLink(
                            formatSocialLink("github", user.links.github)
                          )
                        }
                        className="text-gray-400 hover:text-white transition-colors"
                        title="GitHub"
                      >
                        <svg
                          className="w-4 h-4"
                          fill="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                        </svg>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
