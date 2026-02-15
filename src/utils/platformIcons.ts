interface PlatformMatch {
  pattern: RegExp;
  icon: string;
  label: string;
}

const PLATFORMS: PlatformMatch[] = [
  { pattern: /github\.com/i, icon: "code", label: "GitHub" },
  { pattern: /gitlab\.com/i, icon: "code", label: "GitLab" },
  { pattern: /bitbucket\.org/i, icon: "code", label: "Bitbucket" },
  { pattern: /twitter\.com|x\.com/i, icon: "tag", label: "X / Twitter" },
  { pattern: /facebook\.com|fb\.com/i, icon: "facebook", label: "Facebook" },
  { pattern: /instagram\.com/i, icon: "photo_camera", label: "Instagram" },
  { pattern: /linkedin\.com/i, icon: "work", label: "LinkedIn" },
  { pattern: /youtube\.com|youtu\.be/i, icon: "play_circle", label: "YouTube" },
  { pattern: /tiktok\.com/i, icon: "music_note", label: "TikTok" },
  { pattern: /reddit\.com/i, icon: "forum", label: "Reddit" },
  { pattern: /discord\.com|discord\.gg/i, icon: "chat", label: "Discord" },
  { pattern: /twitch\.tv/i, icon: "videogame_asset", label: "Twitch" },
  { pattern: /medium\.com/i, icon: "article", label: "Medium" },
  { pattern: /dev\.to/i, icon: "terminal", label: "DEV" },
  { pattern: /stackoverflow\.com/i, icon: "help", label: "Stack Overflow" },
  { pattern: /dribbble\.com/i, icon: "palette", label: "Dribbble" },
  { pattern: /behance\.net/i, icon: "brush", label: "Behance" },
  { pattern: /figma\.com/i, icon: "design_services", label: "Figma" },
  { pattern: /spotify\.com/i, icon: "headphones", label: "Spotify" },
  { pattern: /pinterest\.com/i, icon: "push_pin", label: "Pinterest" },
  { pattern: /snapchat\.com/i, icon: "camera", label: "Snapchat" },
  { pattern: /whatsapp\.com/i, icon: "message", label: "WhatsApp" },
  { pattern: /telegram\.org|t\.me/i, icon: "send", label: "Telegram" },
  { pattern: /slack\.com/i, icon: "workspaces", label: "Slack" },
  { pattern: /notion\.so/i, icon: "description", label: "Notion" },
];

const DEFAULT_ICON = "link";

export function getPlatformIcon(url: string): { icon: string; label: string } {
  for (const platform of PLATFORMS) {
    if (platform.pattern.test(url)) {
      return { icon: platform.icon, label: platform.label };
    }
  }
  return { icon: DEFAULT_ICON, label: "Link" };
}
