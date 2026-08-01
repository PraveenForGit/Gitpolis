import Image from "next/image";
import type { GithubUser } from "@/lib/types";

const ProfileCard = ({ user }: { user: GithubUser}) => {
    return (
          <div className="bg-surface border border-border rounded-3xl p-6 flex items-center gap-4">
            <Image
              src={user.avatar_url}
              alt={user.name || user.login}
              width={64}
              height={64}
              className="rounded-full"
            />
            <div>
                <h2 className="font-semibold text-lg">{user.name ?? user.login}</h2>
                <p className="text-muted text-sm">@{user.login}</p>
                {user.bio && <p className="text-sm mt-1">{user.bio}</p>}
                <div className="flex gap-4 text-sm text-muted mt-2">
                    <span>{user.followers} followers</span>
                    <span>{user.public_repos} public repos</span>
                </div>
            </div>
          </div>
    );
};

export default ProfileCard;