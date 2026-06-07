"use client";
import React from "react";
import type { ShopInfo } from "@/lib/interfaces";
import { inputClass, labelClass } from "./styles";

interface SocialMediaSectionProps {
  shopInfo: ShopInfo;
  update: (partial: Partial<ShopInfo>) => void;
}

// Social media profile URL editor.
export default function SocialMediaSection({
  shopInfo,
  update,
}: SocialMediaSectionProps) {
  return (
    <div className="space-y-4">
      <div>
        <label className={labelClass} htmlFor="social-media-facebook-url">
          Facebook URL
        </label>
        <input
          id="social-media-facebook-url"
          type="url"
          value={shopInfo.socialMedia?.facebook ?? ""}
          onChange={(e) =>
            update({
              socialMedia: {
                ...shopInfo.socialMedia,
                facebook: e.target.value,
              },
            })
          }
          placeholder="https://facebook.com/yourbusiness"
          className={inputClass}
        />
      </div>
      <div>
        <label className={labelClass} htmlFor="social-media-twitter-url">
          Twitter URL
        </label>
        <input
          id="social-media-twitter-url"
          type="url"
          value={shopInfo.socialMedia?.twitter ?? ""}
          onChange={(e) =>
            update({
              socialMedia: {
                ...shopInfo.socialMedia,
                twitter: e.target.value,
              },
            })
          }
          placeholder="https://twitter.com/yourbusiness"
          className={inputClass}
        />
      </div>
      <div>
        <label className={labelClass} htmlFor="social-media-instagram-url">
          Instagram URL
        </label>
        <input
          id="social-media-instagram-url"
          type="url"
          value={shopInfo.socialMedia?.instagram ?? ""}
          onChange={(e) =>
            update({
              socialMedia: {
                ...shopInfo.socialMedia,
                instagram: e.target.value,
              },
            })
          }
          placeholder="https://instagram.com/yourbusiness"
          className={inputClass}
        />
      </div>
      <div>
        <label className={labelClass} htmlFor="social-media-tiktok-url">
          TikTok URL
        </label>
        <input
          id="social-media-tiktok-url"
          type="url"
          value={shopInfo.socialMedia?.tiktok ?? ""}
          onChange={(e) =>
            update({
              socialMedia: {
                ...shopInfo.socialMedia,
                tiktok: e.target.value,
              },
            })
          }
          placeholder="https://tiktok.com/@yourbusiness"
          className={inputClass}
        />
      </div>
    </div>
  );
}
