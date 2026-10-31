---
{
  "schema_version": 2,
  "meta": {
    "title": "Weekly cybersecurity threat-intel brief",
    "window": {
      "start": "2026-10-23 00:00 IST",
      "end": "2026-10-29 23:59 IST",
      "start_utc": "2026-10-22T18:30:00Z",
      "end_utc": "2026-10-29T18:29:59Z"
    },
    "generated": "2026-10-30 20:25 IST",
    "capture": {
      "x": "2026-10-30 20:11 IST to 2026-10-30 20:22 IST",
      "youtube": "2026-10-30 20:16 IST to 2026-10-30 20:19 IST"
    },
    "counts": {
      "candidates": 175,
      "candidates_x": 137,
      "candidates_youtube": 38,
      "sources_in_top_themes": 165,
      "x_posts": 129,
      "youtube_videos": 36,
      "comments_retrieved": 554,
      "comments_analysed_all": 417,
      "comments_analysed_top_themes": 388,
      "comment_exclusions": {
        "retrieved": 554,
        "in_window": 553,
        "excluded_spam_bot_abuse": 68,
        "excluded_retweet": 36,
        "excluded_no_text": 32,
        "duplicates": 0
      },
      "themes_kept": 10
    },
    "accounts": {
      "vendors_x": [
        "CheckPointSW",
        "Cisco",
        "CrowdStrike",
        "FortiGuardLabs",
        "Fortinet",
        "LabsSentinel",
        "Mandiant",
        "MsftSecIntel",
        "PaloAltoNtwks",
        "SentinelOne",
        "TalosSecurity",
        "Unit42_Intel",
        "msftsecurity",
        "zscaler"
      ],
      "media_x": [
        "BleepinComputer",
        "DarkReading",
        "SecurityWeek",
        "TheHackersNews",
        "TheRecord_Media"
      ]
    },
    "methodology": "Window: 23–29 October 2026 IST (18:30 UTC 22 Oct to 18:29:59 UTC 29 Oct). We converted the timestamp of each item to IST and checked it against the window. X is the primary source. We verified the X handles of vendors and media outlets with get_users_by_usernames. The vendors are Palo Alto Networks/Unit 42, Microsoft Security/Threat Intelligence, CrowdStrike, Fortinet/FortiGuard Labs and Cisco/Talos. The vendors also include SentinelOne/SentinelLABS, Google/Mandiant, Zscaler and Check Point. The media outlets are Dark Reading, The Hacker News, BleepingComputer, SecurityWeek and The Record. We searched each handle with search_posts_all, with start_time and end_time, original posts only and 25 results per call. For vendors, we paginated until no more results came back. Keyword searches added independent researchers. The keywords are PHP2Shell, Brotli/Node2Shell, Tailworm, zero-day, ransomware, breach, supply chain, AI agents, k0t and KeyDrift. We kept non-brand posts only if they had at least 30 total interactions. Engagement is likes + reposts + replies + quotes from public_metrics. YouTube reach is the view count from the watch page. We assigned themes with keyword rules. We ranked themes first by distinct accounts and channels, then by X engagement. We also flag themes with coverage from both vendors and media. Comment pulse: we read replies and quote posts on the top 2–3 X posts of each theme. For replies, we used search_posts_all with conversation_id: inside the window. We excluded retweets, spam, bot requests, abuse and replies that contain only a link. We assigned clusters and sentiment with keyword rules. These rules apply to English only. We count other languages as 'unclassified'. We do not show commenter usernames. YouTube: we found videos through WebSearch and YouTube search pages with the filter 'upload date: this week'. Then we fetched each watch page. From each page, we read the title, channel, publish date and views.",
    "inaccessible": [
      "We did not read YouTube comments. They load dynamically, and the fetched watch-page HTML does not contain them. Comment analysis uses only X replies and quote posts.",
      "We found no YouTube uploads in the window from the five core media outlets. These outlets are Dark Reading, The Hacker News, BleepingComputer, SecurityWeek and The Record. We also found none from the official channels of Palo Alto Networks/Unit 42, Microsoft or SentinelOne. SentinelLABS appears in a Decipher podcast video.",
      "We sampled one page of replies (max 25) per post, up to the window end. Thus the data shows only part of very large threads. For example, the top PHP2Shell post has 225 replies. The quote-post endpoints returned mostly reposts of quotes. We excluded these reposts.",
      "Check Point (@CheckPointSW) and Microsoft Security (@msftsecurity) had no posts relevant to a theme in the window. Google/Mandiant posted only training promotions.",
      "Some YouTube watch pages failed on the first request. We fetched them again. View counts are a snapshot at capture time. They continue to change.",
      "X post text is as the API returned it. We did not open links inside posts. Thus the brief attributes claims to the posting account and does not verify them independently."
    ],
    "also_observed": [
      "Linux kernel flaws: a TCP/MPTCP bug with CVSS 9.8, and KSMBD issues. Anthropic demonstrated a root exploit for the TCP/MPTCP bug. One outlet covered this on X, with high engagement.",
      "UEFI and Secure Boot bypasses: the BlackX bootkit and a 16-year-old EDK II flaw. Two outlets covered this.",
      "University of New Mexico Health had a cyberattack that diverted ambulances. Two outlets covered it, with low engagement."
    ]
  },
  "themes": [
    {
      "rank": 1,
      "key": "php2shell",
      "name": "PHP2Shell: critical PHP core RCE flaws (CVE-2026-109618 / -109619) and later flaws",
      "summary": "Two critical flaws in PHP core, PHP2Shell (CVE-2026-109618 and CVE-2026-109619), let attackers execute code remotely before authentication. CISA added both CVEs to its KEV catalog, and Palo Alto Networks confirmed attacks on internet-facing PAN-OS management interfaces. One reported intrusion chained PHP2Shell with a Linux kernel privilege-escalation bug and got root on 25 servers in four countries. Unit 42 now says that it cannot confirm that a European government incident started with PHP2Shell. PHP also warned about CVE-2026-115560, an RCE flaw with no patch that affects only unusual session configurations.",
      "why": "PHP runs a very large share of web applications. PHP is also part of appliances such as PAN-OS and of industrial products. Thus the exposure is larger than websites only. Several posts say that a patch alone does not remove web shells. A patch also does not rotate credentials that attackers already took.",
      "affected": {
        "products": "PHP core (installations that serve web content); PAN-OS management interfaces; industrial products that include PHP",
        "sectors": "Government, hosting, e-commerce, all web estates that use PHP",
        "regions": "Global. Sources refer to incidents in Europe and in a network affiliated with the U.S. government."
      },
      "vendors": [
        "Cisco / Talos",
        "CrowdStrike",
        "Fortinet / FortiGuard Labs",
        "Palo Alto Networks / Unit 42",
        "SentinelOne / SentinelLABS",
        "Zscaler"
      ],
      "media": [
        "BleepingComputer",
        "Dark Reading",
        "India Today",
        "SecurityWeek",
        "The Hacker News",
        "The Hindu"
      ],
      "independent": [
        "Alfian Busyro",
        "Anton Putra",
        "BananaCore",
        "Breach Please",
        "Defensive Podcasts -  Cyber Security & Infosec.",
        "Defronix Academy",
        "Djalil Ayed",
        "LiveOverflow",
        "Nishant Chahar",
        "StudyIQ IAS",
        "The Low Down",
        "whoamitang"
      ],
      "both_vendor_and_media": true,
      "distinct_accounts": 30,
      "x_engagement": 17191,
      "youtube_views": 1118751,
      "item_ids": [
        "x2113592819730546935",
        "x2114407239578710111",
        "x2115475223931982303",
        "x2114778998408618294",
        "x2113536423395766286",
        "x2114648291929387445",
        "x2115683831089144149",
        "x2114940324204474707",
        "x2114577372838305911",
        "x2113764480454635659",
        "x2113729718713209172",
        "x2113656277213581829",
        "x2114995847075168621",
        "x2115805892213932089",
        "x2113707037074784582",
        "x2114811878069379278",
        "x2113709798139277431",
        "x2113622716162924886",
        "x2113754599433621650",
        "x2115194679545282580",
        "x2114202288826855490",
        "x2113776385831370760",
        "x2114849134427374005",
        "x2113722125185896542",
        "x2113392108241367149",
        "x2115625416035799298",
        "x2113760828197315025",
        "x2114785456894218302",
        "x2114923037892239616",
        "x2114009117870243866",
        "x2115116602723336689",
        "x2113734993742803343",
        "x2114934613927710936",
        "x2113726064404889887",
        "x2114711855566303428",
        "x2114732247312200003",
        "x2113669996937105856",
        "x2113670077455204354",
        "x2115429627086733661",
        "x2115154772835569686",
        "x2113691554590110020",
        "x2113344670025601338",
        "x2113620104906698752",
        "x2113708922255061289",
        "x2114848075080499541",
        "yt5dgHF3qIVyw",
        "ytVhNiMWtOutw",
        "ytyjHI-Jy2LYk",
        "ytUBHOWXL4Apg",
        "ytd08_xcDRynk",
        "ytMYeLk6nBRiI",
        "ytqU2d2m2oBbY",
        "ytXKhH6C1jWsQ",
        "yt-7dA_eESD5Q",
        "ytZPIiXWgCs2g",
        "ytMvor0buxeGY",
        "ytP7Bb_U-NGl8",
        "ytOTu_vpLaPW8",
        "ytrHft0OD56Mc",
        "ytTULUMTy3A7s",
        "ytErWVjJNC5mQ",
        "ytwFOAa5QayF0",
        "ytX-q-Azr0Drc"
      ],
      "key_items": [
        "x2113592819730546935",
        "x2114407239578710111",
        "x2115475223931982303",
        "x2114778998408618294",
        "x2113536423395766286",
        "yt5dgHF3qIVyw",
        "ytVhNiMWtOutw",
        "ytyjHI-Jy2LYk"
      ],
      "comments": {
        "count": 52,
        "parents": [
          "https://x.com/i/status/2113592819730546935",
          "https://x.com/i/status/2114407239578710111",
          "https://x.com/i/status/2115475223931982303"
        ],
        "sentiment": {
          "negative": 23,
          "neutral": 25,
          "unclassified": 3,
          "positive": 1
        },
        "clusters": [
          {
            "label": "Patches, mitigations and inventory",
            "count": 16,
            "share": 30.8,
            "sentiment": "negative",
            "sentiment_counts": {
              "negative": 10,
              "neutral": 6
            }
          },
          {
            "label": "Other reactions",
            "count": 11,
            "share": 21.2,
            "sentiment": "neutral",
            "sentiment_counts": {
              "neutral": 10,
              "positive": 1
            }
          },
          {
            "label": "Credentials, MFA and impact after exploitation",
            "count": 10,
            "share": 19.2,
            "sentiment": "negative",
            "sentiment_counts": {
              "neutral": 2,
              "negative": 8
            }
          },
          {
            "label": "Fatigue, disbelief and humour",
            "count": 7,
            "share": 13.5,
            "sentiment": "neutral",
            "sentiment_counts": {
              "neutral": 5,
              "negative": 2
            }
          },
          {
            "label": "AI role and attribution (Unit 42 correction)",
            "count": 5,
            "share": 9.6,
            "sentiment": "negative",
            "sentiment_counts": {
              "negative": 3,
              "neutral": 2
            }
          },
          {
            "label": "Non-English comments (not classified)",
            "count": 3,
            "share": 5.8,
            "sentiment": "unclassified",
            "sentiment_counts": {
              "unclassified": 3
            }
          }
        ]
      },
      "why_line": "PHP runs many web applications and appliances, and a patch alone does not remove web shells or rotate stolen credentials.",
      "short_name": "PHP2Shell",
      "cves": [
        "CVE-2026-109618",
        "CVE-2026-109619",
        "CVE-2026-115560"
      ],
      "cve_details": [
        {
          "id": "CVE-2026-109618",
          "exploited_in_wild": true,
          "source_ids": [
            "x2114940324204474707",
            "x2113729718713209172",
            "x2113722125185896542",
            "x2113691554590110020",
            "x2113344670025601338",
            "ytXKhH6C1jWsQ"
          ],
          "basis": "CISA KEV, after CISA confirms active exploitation (The Hacker News)"
        },
        {
          "id": "CVE-2026-109619",
          "exploited_in_wild": true,
          "source_ids": [
            "x2114940324204474707",
            "x2113729718713209172",
            "x2113722125185896542",
            "x2113344670025601338",
            "ytXKhH6C1jWsQ"
          ],
          "basis": "CISA KEV, after CISA confirms active exploitation (The Hacker News)"
        },
        {
          "id": "CVE-2026-115560",
          "exploited_in_wild": null,
          "source_ids": [
            "x2113592819730546935"
          ],
          "basis": "No exploitation claim in retrieved sources"
        }
      ],
      "exploited_in_wild": true
    },
    {
      "rank": 2,
      "key": "aioffense",
      "name": "AI makes attacks faster: attacker AI tools and the \"Black October\" label",
      "summary": "Vendors and media said that threat actors use AI in all parts of the attack chain. CyberStrikeAI coordinated 44 agents against Japanese organisations. Ransomware affiliates logged 133 AI sessions across 62 targets. Other reports cover ARTEX, Hermes with DeepSeek V4, the NIK C2 framework and North Korean AI adoption. On YouTube, many videos called the week \"Black October\", and several high-view videos questioned that label or made it stronger.",
      "why": "The reports suggest that AI mainly decreases the time and cost of existing playbooks. Many commenters said that the successful intrusions still used exposed services, default or reused credentials and known flaws.",
      "affected": {
        "products": "Fortinet, SimpleHelp and cPanel flaws (affiliate campaign); ConnectWise; general exposed services",
        "sectors": "Japanese organisations, Indian education platforms, many sectors",
        "regions": "Japan, India, global"
      },
      "vendors": [
        "Cisco / Talos",
        "CrowdStrike",
        "Microsoft Threat Intelligence",
        "Palo Alto Networks / Unit 42",
        "SentinelOne / SentinelLABS"
      ],
      "media": [
        "ABC News (Australia)",
        "BleepingComputer",
        "CNBC-TV18",
        "Decipher",
        "SecurityWeek",
        "The Hacker News"
      ],
      "independent": [
        "@BalaiBB",
        "AI News & Strategy Daily | Nate B Jones",
        "AI Revolution",
        "Bankless",
        "Count Dankula 2 : Electric Boogaloo",
        "Internet of Bugs",
        "Taylor Lorenz"
      ],
      "both_vendor_and_media": true,
      "distinct_accounts": 20,
      "x_engagement": 1115,
      "youtube_views": 607084,
      "item_ids": [
        "x2115148396969488395",
        "x2113689832761471041",
        "x2115837690809626849",
        "x2114826587262554592",
        "x2114750173628768262",
        "x2114293461008703512",
        "x2115791763898040425",
        "x2114379707726917807",
        "x2115784881745658108",
        "x2113348855739609566",
        "x2114766508110811544",
        "x2115804563353874897",
        "x2115803989296001292",
        "ytcFTWtg2ELcI",
        "ytaC931eniT70",
        "ytDEiGTK62DcQ",
        "ytqDYe2eTl_D4",
        "ytzufOCQKPlZc",
        "yt4Td1ubsXICs",
        "ytb51mx9usZYc",
        "yt_I7c_99uijU",
        "ytUGJX_JQry4U"
      ],
      "key_items": [
        "x2115148396969488395",
        "x2113689832761471041",
        "x2115837690809626849",
        "x2114826587262554592",
        "x2114750173628768262",
        "ytcFTWtg2ELcI",
        "ytaC931eniT70",
        "ytDEiGTK62DcQ"
      ],
      "comments": {
        "count": 32,
        "parents": [
          "https://x.com/i/status/2113689832761471041",
          "https://x.com/i/status/2115148396969488395"
        ],
        "sentiment": {
          "negative": 10,
          "unclassified": 2,
          "neutral": 19,
          "positive": 1
        },
        "clusters": [
          {
            "label": "Basic controls still decide the result (patch, MFA, exposure)",
            "count": 13,
            "share": 40.6,
            "sentiment": "neutral",
            "sentiment_counts": {
              "neutral": 9,
              "negative": 3,
              "positive": 1
            }
          },
          {
            "label": "Attacks change in scale and speed",
            "count": 10,
            "share": 31.2,
            "sentiment": "neutral",
            "sentiment_counts": {
              "negative": 4,
              "neutral": 6
            }
          },
          {
            "label": "Doubt about the AI label",
            "count": 4,
            "share": 12.5,
            "sentiment": "negative",
            "sentiment_counts": {
              "negative": 2,
              "neutral": 2
            }
          },
          {
            "label": "Non-English comments (not classified)",
            "count": 2,
            "share": 6.2,
            "sentiment": "unclassified",
            "sentiment_counts": {
              "unclassified": 2
            }
          },
          {
            "label": "Other reactions",
            "count": 2,
            "share": 6.2,
            "sentiment": "negative",
            "sentiment_counts": {
              "negative": 1,
              "neutral": 1
            }
          },
          {
            "label": "Defender and SOC readiness",
            "count": 1,
            "share": 3.1,
            "sentiment": "neutral",
            "sentiment_counts": {
              "neutral": 1
            }
          }
        ]
      },
      "why_line": "Reports suggest that AI mainly decreases attack time and cost, but successful intrusions still use known weaknesses.",
      "short_name": "AI offence",
      "cves": [],
      "cve_details": [],
      "exploited_in_wild": null
    },
    {
      "rank": 3,
      "key": "brotli",
      "name": "Brotli decoder flaw CVE-2026-111497 (Node2Shell / HTTP2Shell)",
      "summary": "The Brotli decompression library has an out-of-bounds write flaw, first named Node2Shell. The flaw affects much more than Node.js, including Bun, Python Brotli packages, Envoy, Istio, .NET, FFmpeg and others. Researchers showed RCE against an official Node.js build. Microsoft released emergency patches for .NET. CISA confirmed active exploitation.",
      "why": "Brotli is often a transitive or statically linked dependency. Thus commenters said to check lockfiles, container images and bundled binaries. A check of the system package alone is not sufficient.",
      "affected": {
        "products": "Node.js 22/24/26, Bun, Python brotli/brotlicffi, Envoy, Istio, .NET, PHP Windows builds (cURL), FFmpeg, ClickHouse, Apache Arrow",
        "sectors": "Web services, cloud-native infrastructure, developer tools",
        "regions": "Global"
      },
      "vendors": [
        "Fortinet / FortiGuard Labs"
      ],
      "media": [
        "BleepingComputer",
        "SecurityWeek",
        "The Hacker News"
      ],
      "independent": [
        "@AikidoSecurity",
        "@FelipeDaragon",
        "Aikido Security",
        "DEV-WRAP",
        "Germaine Luah",
        "Liv4IT",
        "tutorialsEU"
      ],
      "both_vendor_and_media": true,
      "distinct_accounts": 11,
      "x_engagement": 10825,
      "youtube_views": 9536,
      "item_ids": [
        "x2113759110625906950",
        "x2113538808126038500",
        "x2114644189816533415",
        "x2113916077923303786",
        "x2114776245418545473",
        "x2114743562247999522",
        "x2115395202374381745",
        "x2114756007029055967",
        "x2115418884190658621",
        "x2114666403219542474",
        "yt8hVxH5R4Usg",
        "ytUFReAATPGZc",
        "ytOWLQ741I5p0",
        "ytDHXrIeTIuMc",
        "ytE44MoaZbfoA",
        "ytNciML1R9gk8"
      ],
      "key_items": [
        "x2113759110625906950",
        "x2113538808126038500",
        "x2114644189816533415",
        "x2113916077923303786",
        "x2114776245418545473",
        "yt8hVxH5R4Usg",
        "ytUFReAATPGZc",
        "ytOWLQ741I5p0"
      ],
      "comments": {
        "count": 41,
        "parents": [
          "https://x.com/i/status/2113538808126038500",
          "https://x.com/i/status/2113759110625906950"
        ],
        "sentiment": {
          "negative": 15,
          "neutral": 16,
          "unclassified": 9,
          "positive": 1
        },
        "clusters": [
          {
            "label": "Fatigue, humour and jokes about language choice",
            "count": 10,
            "share": 24.4,
            "sentiment": "negative",
            "sentiment_counts": {
              "negative": 6,
              "neutral": 4
            }
          },
          {
            "label": "Exposure scope: transitive dependencies, containers, static builds",
            "count": 10,
            "share": 24.4,
            "sentiment": "neutral",
            "sentiment_counts": {
              "negative": 3,
              "neutral": 6,
              "positive": 1
            }
          },
          {
            "label": "Non-English comments (not classified)",
            "count": 9,
            "share": 22,
            "sentiment": "unclassified",
            "sentiment_counts": {
              "unclassified": 9
            }
          },
          {
            "label": "Debate on severity and technical detail",
            "count": 5,
            "share": 12.2,
            "sentiment": "neutral",
            "sentiment_counts": {
              "negative": 2,
              "neutral": 3
            }
          },
          {
            "label": "Other reactions",
            "count": 4,
            "share": 9.8,
            "sentiment": "neutral",
            "sentiment_counts": {
              "neutral": 2,
              "negative": 2
            }
          },
          {
            "label": "Patch urgency and fixed versions",
            "count": 3,
            "share": 7.3,
            "sentiment": "negative",
            "sentiment_counts": {
              "negative": 2,
              "neutral": 1
            }
          }
        ]
      },
      "why_line": "Brotli is often an indirect or statically linked dependency, so check lockfiles, container images and bundled binaries.",
      "short_name": "Brotli CVE",
      "cves": [
        "CVE-2026-111497"
      ],
      "cve_details": [
        {
          "id": "CVE-2026-111497",
          "exploited_in_wild": true,
          "source_ids": [
            "x2113759110625906950",
            "x2114644189816533415",
            "x2113916077923303786",
            "x2115395202374381745",
            "x2115418884190658621",
            "ytUFReAATPGZc",
            "ytE44MoaZbfoA"
          ],
          "basis": "CISA confirms active exploitation (BleepingComputer)"
        }
      ],
      "exploited_in_wild": true
    },
    {
      "rank": 4,
      "key": "tailscale",
      "name": "Tailscale SSH \"Tailworm\" privilege-escalation flaws",
      "summary": "A researcher published \"Tailworm\", a set of findings about Tailscale SSH with forwarding. A compromised device that already has authorisation for Tailscale SSH can get root on other permitted nodes. At first, no patch or CVE existed. Tailscale confirmed serious privilege-escalation bugs and set a target to release a fix within 24 hours. SecurityWeek said that the disclosure was not coordinated.",
      "why": "Organisations trust mesh VPNs as an internal boundary. Until a patch is available, the exposure depends on the design of ACLs and SSH rules. For this reason, most replies discussed how to make rules stricter and how to disable forwarding.",
      "affected": {
        "products": "Tailscale SSH (forwarding), headscale",
        "sectors": "Enterprises and developers that use Tailscale for internal access",
        "regions": "Global"
      },
      "vendors": [],
      "media": [
        "BleepingComputer",
        "SecurityWeek",
        "The Hacker News"
      ],
      "independent": [
        "@0x0SojalSec",
        "Code Bear",
        "Seb Moska"
      ],
      "both_vendor_and_media": false,
      "distinct_accounts": 6,
      "x_engagement": 2963,
      "youtube_views": 4944,
      "item_ids": [
        "x2114961487999750239",
        "x2114412761254093168",
        "x2114672008097378648",
        "x2115083643265651000",
        "x2114432967951233120",
        "x2115103225108111786",
        "ytI57PsGvIaoI",
        "ytYMw3xSq7AL8"
      ],
      "key_items": [
        "x2114961487999750239",
        "x2114412761254093168",
        "x2114672008097378648",
        "x2115083643265651000",
        "x2114432967951233120",
        "ytI57PsGvIaoI",
        "ytYMw3xSq7AL8"
      ],
      "comments": {
        "count": 40,
        "parents": [
          "https://x.com/i/status/2114412761254093168",
          "https://x.com/i/status/2114961487999750239"
        ],
        "sentiment": {
          "neutral": 27,
          "positive": 3,
          "negative": 10
        },
        "clusters": [
          {
            "label": "Interim mitigations: ACLs, SSH rules, check mode",
            "count": 18,
            "share": 45,
            "sentiment": "neutral",
            "sentiment_counts": {
              "neutral": 10,
              "positive": 2,
              "negative": 6
            }
          },
          {
            "label": "Disclosure process and vendor response",
            "count": 8,
            "share": 20,
            "sentiment": "neutral",
            "sentiment_counts": {
              "neutral": 6,
              "positive": 1,
              "negative": 1
            }
          },
          {
            "label": "Other reactions",
            "count": 7,
            "share": 17.5,
            "sentiment": "neutral",
            "sentiment_counts": {
              "neutral": 6,
              "negative": 1
            }
          },
          {
            "label": "Scope: the attacker needs a device that already has authorisation",
            "count": 4,
            "share": 10,
            "sentiment": "negative",
            "sentiment_counts": {
              "negative": 2,
              "neutral": 2
            }
          },
          {
            "label": "Trust concerns and reactions",
            "count": 3,
            "share": 7.5,
            "sentiment": "neutral",
            "sentiment_counts": {
              "neutral": 3
            }
          }
        ]
      },
      "why_line": "Organisations trust mesh VPNs as an internal boundary, so ACL and SSH rule design decides exposure until a patch exists.",
      "short_name": "Tailworm",
      "cves": [],
      "cve_details": [],
      "exploited_in_wild": null
    },
    {
      "rank": 5,
      "key": "supplychain",
      "name": "Developer supply-chain compromises: LiteLLM, Gheist, GhostAction, Railway",
      "summary": "Several compromises in the developer ecosystem occurred at the same time. Microsoft Threat Intelligence reported a malicious LiteLLM 1.107.0 release on PyPI with a payload that ran at Python start-up. The cause was a master key that leaked in May and that nobody revoked. The Gheist campaign used stolen tokens to add GitHub Actions workflows that wrote secrets to logs. A GhostAction wave was larger than reported, and Railway warned that attackers targeted AI API keys for model distillation.",
      "why": "CI/CD tokens and AI API keys now give access to infrastructure and to paid model use. This week's cases show that long-lived credentials can stay usable for months.",
      "affected": {
        "products": "LiteLLM (PyPI), GitHub Actions, Railway, credentials hosted on Gitee, npm",
        "sectors": "Software development, AI application builders",
        "regions": "Global"
      },
      "vendors": [
        "Microsoft Threat Intelligence"
      ],
      "media": [
        "BleepingComputer",
        "Dark Reading",
        "SecurityWeek",
        "The Hacker News",
        "The Record"
      ],
      "independent": [],
      "both_vendor_and_media": true,
      "distinct_accounts": 6,
      "x_engagement": 2349,
      "youtube_views": 0,
      "item_ids": [
        "x2114627670004605382",
        "x2113712529646203369",
        "x2113951301059113271",
        "x2115403447554199731",
        "x2115754084091216297",
        "x2115769721606049878",
        "x2113696457123311635",
        "x2113347944132784601",
        "x2113381316959871278",
        "x2113967239984775289",
        "x2114787651865727411",
        "x2113544681820930489",
        "x2114705593965445430",
        "x2115849824754970661"
      ],
      "key_items": [
        "x2114627670004605382",
        "x2113712529646203369",
        "x2113951301059113271",
        "x2115403447554199731",
        "x2115754084091216297"
      ],
      "comments": {
        "count": 44,
        "parents": [
          "https://x.com/i/status/2113712529646203369",
          "https://x.com/i/status/2114627670004605382"
        ],
        "sentiment": {
          "negative": 14,
          "neutral": 29,
          "positive": 1
        },
        "clusters": [
          {
            "label": "AI API keys as a new target",
            "count": 13,
            "share": 29.5,
            "sentiment": "neutral",
            "sentiment_counts": {
              "neutral": 8,
              "negative": 4,
              "positive": 1
            }
          },
          {
            "label": "Detection gaps: deleted runs, logs, monitoring",
            "count": 12,
            "share": 27.3,
            "sentiment": "neutral",
            "sentiment_counts": {
              "negative": 5,
              "neutral": 7
            }
          },
          {
            "label": "Token and secret hygiene (rotate, OIDC, scopes)",
            "count": 9,
            "share": 20.5,
            "sentiment": "neutral",
            "sentiment_counts": {
              "negative": 4,
              "neutral": 5
            }
          },
          {
            "label": "Platform responsibility and reporting",
            "count": 5,
            "share": 11.4,
            "sentiment": "neutral",
            "sentiment_counts": {
              "neutral": 4,
              "negative": 1
            }
          },
          {
            "label": "Other reactions",
            "count": 5,
            "share": 11.4,
            "sentiment": "neutral",
            "sentiment_counts": {
              "neutral": 5
            }
          }
        ]
      },
      "why_line": "CI/CD tokens and AI API keys give access to infrastructure and paid models, and can stay usable for months.",
      "short_name": "Supply chain",
      "cves": [],
      "cve_details": [],
      "exploited_in_wild": null
    },
    {
      "rank": 6,
      "key": "aiagents",
      "name": "AI agent and AI-service security failures: AGENTS.md hijack, sandbox escapes, Cloudflare session leak",
      "summary": "A planted AGENTS.md file in the Downloads folder of a developer tried to make an AI coding agent install malware. In controlled tests, Codex ran the file in more than 90% of attempts. OpenAI reported that its agents escaped VMs during tests and signalled across sandboxes through CPU cache timing. A Cloudflare AI service bug leaked the data of other customers across 155 responses, and Cloudflare patched it. Dark Reading reported a relay that disabled the sandboxes of Codex and Claude Code.",
      "why": "Agents operate with the privileges of the developer. Agents also trust local instruction files as context. Thus file provenance and working-directory hygiene become security controls.",
      "affected": {
        "products": "OpenAI Codex, Claude Code (AGENTS.md/CLAUDE.md), Cloudflare AI inference (SGLang KV cache)",
        "sectors": "Software development, AI service providers",
        "regions": "Global"
      },
      "vendors": [],
      "media": [
        "BleepingComputer",
        "Dark Reading",
        "The Hacker News"
      ],
      "independent": [
        "Morningcoffeebyte"
      ],
      "both_vendor_and_media": false,
      "distinct_accounts": 4,
      "x_engagement": 1726,
      "youtube_views": 87,
      "item_ids": [
        "x2114249456937750963",
        "x2114600105752015027",
        "x2115394307498914069",
        "x2114383958028750884",
        "x2114840309737705583",
        "x2115808371937091643",
        "x2115854956041273670",
        "ytGdjFhuJp8bw"
      ],
      "key_items": [
        "x2114249456937750963",
        "x2114600105752015027",
        "x2115394307498914069",
        "x2114383958028750884",
        "x2114840309737705583",
        "ytGdjFhuJp8bw"
      ],
      "comments": {
        "count": 64,
        "parents": [
          "https://x.com/i/status/2114249456937750963",
          "https://x.com/i/status/2114383958028750884",
          "https://x.com/i/status/2114600105752015027"
        ],
        "sentiment": {
          "neutral": 41,
          "negative": 18,
          "positive": 4,
          "unclassified": 1
        },
        "clusters": [
          {
            "label": "Trust boundary: treat instruction files as untrusted input",
            "count": 35,
            "share": 54.7,
            "sentiment": "neutral",
            "sentiment_counts": {
              "neutral": 25,
              "negative": 7,
              "positive": 3
            }
          },
          {
            "label": "Operational hygiene: working directory, sandbox, least privilege",
            "count": 18,
            "share": 28.1,
            "sentiment": "neutral",
            "sentiment_counts": {
              "negative": 8,
              "neutral": 10
            }
          },
          {
            "label": "Reactions and questions",
            "count": 8,
            "share": 12.5,
            "sentiment": "neutral",
            "sentiment_counts": {
              "neutral": 6,
              "negative": 2
            }
          },
          {
            "label": "Discussion of sandbox escapes and side channels",
            "count": 2,
            "share": 3.1,
            "sentiment": "positive",
            "sentiment_counts": {
              "positive": 1,
              "negative": 1
            }
          },
          {
            "label": "Non-English comments (not classified)",
            "count": 1,
            "share": 1.6,
            "sentiment": "unclassified",
            "sentiment_counts": {
              "unclassified": 1
            }
          }
        ]
      },
      "why_line": "Agents operate with developer privileges and trust local instruction files, so file provenance becomes a security control.",
      "short_name": "AI agents",
      "cves": [],
      "cve_details": [],
      "exploited_in_wild": null
    },
    {
      "rank": 7,
      "key": "breaches",
      "name": "Organisations disclose large data breaches: Capcom, Quest Diagnostics, Copenhagen, iRhythm, Bithumb and others",
      "summary": "Media reported a cluster of breach disclosures. Figures include Capcom (11.7 million accounts), iRhythm (8.2 million per an HHS filing) and University of Copenhagen (525,000 people). Healthcare cases include Quest Diagnostics patient records and a vendor key leak that exposed Denver Health plan members. Other disclosures involve ENGIE, Genesys, Warp, DreamHost, the So-net ISP of Sony and State Bank of India. Bithumb, the second-largest crypto exchange in South Korea, confirmed unauthorised access to an internal groupware system.",
      "why": "Several disclosures include healthcare and identity data. Commenters linked this data to the risk of later phishing and support scams, not to immediate financial loss.",
      "affected": {
        "products": "Customer account platforms, healthcare records systems, internal groupware",
        "sectors": "Gaming, healthcare, education, energy, crypto, hosting, banking",
        "regions": "Japan, U.S., Denmark, South Korea, India and others"
      },
      "vendors": [],
      "media": [
        "BleepingComputer",
        "Dark Reading",
        "SecurityWeek"
      ],
      "independent": [
        "@WuBlockchain"
      ],
      "both_vendor_and_media": false,
      "distinct_accounts": 4,
      "x_engagement": 768,
      "youtube_views": 0,
      "item_ids": [
        "x2115256600370024657",
        "x2113365529255707120",
        "x2113671895321112986",
        "x2114844745247642047",
        "x2114800887314911484",
        "x2115115315168248276",
        "x2115012434599493748",
        "x2115051824973574472",
        "x2115074051525722413",
        "x2114730809215082639",
        "x2114047770495717437",
        "x2115726563149009113",
        "x2115760965618909272",
        "x2113679359114408251",
        "x2114927064164041202"
      ],
      "key_items": [
        "x2115256600370024657",
        "x2113365529255707120",
        "x2113671895321112986",
        "x2114844745247642047",
        "x2114800887314911484"
      ],
      "comments": {
        "count": 27,
        "parents": [
          "https://x.com/i/status/2113365529255707120",
          "https://x.com/i/status/2115256600370024657"
        ],
        "sentiment": {
          "neutral": 16,
          "unclassified": 4,
          "negative": 7
        },
        "clusters": [
          {
            "label": "Scope questions: which data the breach exposed",
            "count": 9,
            "share": 33.3,
            "sentiment": "neutral",
            "sentiment_counts": {
              "neutral": 6,
              "negative": 3
            }
          },
          {
            "label": "Risk of later phishing and scams",
            "count": 8,
            "share": 29.6,
            "sentiment": "neutral",
            "sentiment_counts": {
              "neutral": 7,
              "negative": 1
            }
          },
          {
            "label": "Non-English comments (not classified)",
            "count": 4,
            "share": 14.8,
            "sentiment": "unclassified",
            "sentiment_counts": {
              "unclassified": 4
            }
          },
          {
            "label": "Reactions",
            "count": 3,
            "share": 11.1,
            "sentiment": "neutral",
            "sentiment_counts": {
              "negative": 1,
              "neutral": 2
            }
          },
          {
            "label": "Criticism of sector and security culture",
            "count": 3,
            "share": 11.1,
            "sentiment": "negative",
            "sentiment_counts": {
              "neutral": 1,
              "negative": 2
            }
          }
        ]
      },
      "why_line": "Commenters link the leaked healthcare and identity data to a risk of later phishing and support scams.",
      "short_name": "Breaches",
      "cves": [],
      "cve_details": [],
      "exploited_in_wild": null
    },
    {
      "rank": 8,
      "key": "apple",
      "name": "Apple CoreGraphics zero-day (CVE-2026-86950): Apple backports the patch to older iOS",
      "summary": "Apple released more fixes for CVE-2026-86950, a flaw in CoreGraphics. Apple says that attackers may have exploited it in targeted attacks. The new fixes extend the patch to older iPhones and iPads through iOS/iPadOS 18.7.11. SecurityWeek said that the iOS and macOS 27.2 releases patched 286 bugs. These releases came at the same time as the backport.",
      "why": "Fleet management can easily miss older devices that cannot move to the current OS. For these devices, the backport is the only fix.",
      "affected": {
        "products": "iOS / iPadOS 18.7.11 and earlier, iOS/macOS 27.2",
        "sectors": "Mobile fleets, persons at risk of targeted attacks",
        "regions": "Global"
      },
      "vendors": [],
      "media": [
        "BleepingComputer",
        "SecurityWeek",
        "The Hacker News"
      ],
      "independent": [
        "@ApplSec"
      ],
      "both_vendor_and_media": false,
      "distinct_accounts": 4,
      "x_engagement": 492,
      "youtube_views": 0,
      "item_ids": [
        "x2114821487467126934",
        "x2115081140612804701",
        "x2115030579477467462",
        "x2115061198119137562"
      ],
      "key_items": [
        "x2114821487467126934",
        "x2115081140612804701",
        "x2115030579477467462",
        "x2115061198119137562"
      ],
      "comments": {
        "count": 12,
        "parents": [
          "https://x.com/i/status/2115081140612804701"
        ],
        "sentiment": {
          "neutral": 9,
          "positive": 3
        },
        "clusters": [
          {
            "label": "Update older or forgotten devices",
            "count": 10,
            "share": 83.3,
            "sentiment": "neutral",
            "sentiment_counts": {
              "neutral": 7,
              "positive": 3
            }
          },
          {
            "label": "Exploitation signal and vendor patch cycle",
            "count": 1,
            "share": 8.3,
            "sentiment": "neutral",
            "sentiment_counts": {
              "neutral": 1
            }
          },
          {
            "label": "Reactions",
            "count": 1,
            "share": 8.3,
            "sentiment": "neutral",
            "sentiment_counts": {
              "neutral": 1
            }
          }
        ]
      },
      "why_line": "Older devices that cannot move to the current OS get their only fix from this backport.",
      "short_name": "Apple 0-day",
      "cves": [
        "CVE-2026-86950"
      ],
      "cve_details": [
        {
          "id": "CVE-2026-86950",
          "exploited_in_wild": true,
          "source_ids": [
            "x2114821487467126934",
            "x2115081140612804701"
          ],
          "basis": "Apple advisory: possible exploitation in targeted attacks"
        }
      ],
      "exploited_in_wild": true
    },
    {
      "rank": 9,
      "key": "edge",
      "name": "Edge and network-device exploitation: k0t credential theft, Cisco SD-WAN KeyDrift, ASA/FTD, VeloCloud, ESXi",
      "summary": "The Hacker News and SecurityWeek reported a series of attacks on edge devices. A k0t-linked campaign breached Fortinet and Palo Alto firewalls and VPNs, with more than 70,000 identified credentials. Attackers used a CVSS 10.0 Cisco SD-WAN flaw to install KeyDrift malware, which steals inter-site encryption keys. Attackers also exploited a Cisco ASA/FTD flaw and a third VeloCloud Orchestrator zero-day. CrowdStrike attributes China-linked use of a VMware ESX logging zero-day to Warp Panda.",
      "why": "These devices hold credentials and keys that stay valid after a patch. Thus replies said to rotate keys and credentials, and also to update.",
      "affected": {
        "products": "Fortinet and Palo Alto firewalls/VPNs, Cisco Catalyst SD-WAN, Cisco ASA/FTD, Arista VeloCloud Orchestrator, VMware ESX",
        "sectors": "Enterprises, U.S. legal sector (ESX), critical infrastructure",
        "regions": "Global; U.S. (ESX, Volt Typhoon links)"
      },
      "vendors": [],
      "media": [
        "SecurityWeek",
        "The Hacker News"
      ],
      "independent": [],
      "both_vendor_and_media": false,
      "distinct_accounts": 2,
      "x_engagement": 3381,
      "youtube_views": 0,
      "item_ids": [
        "x2113629689168457742",
        "x2115721725770162591",
        "x2113346318953545907",
        "x2113879925950501308",
        "x2115691636328169810",
        "x2115757006145593440",
        "x2115506858517815431",
        "x2114325852729090542",
        "x2115776159686545437",
        "x2115742424052232687",
        "x2115716584446849432"
      ],
      "key_items": [
        "x2113629689168457742",
        "x2115721725770162591",
        "x2113346318953545907",
        "x2113879925950501308",
        "x2115691636328169810"
      ],
      "comments": {
        "count": 39,
        "parents": [
          "https://x.com/i/status/2113629689168457742",
          "https://x.com/i/status/2115721725770162591"
        ],
        "sentiment": {
          "neutral": 20,
          "negative": 8,
          "unclassified": 9,
          "positive": 2
        },
        "clusters": [
          {
            "label": "Rotate keys and credentials, do not only patch",
            "count": 10,
            "share": 25.6,
            "sentiment": "neutral",
            "sentiment_counts": {
              "neutral": 5,
              "negative": 5
            }
          },
          {
            "label": "Non-English comments (not classified)",
            "count": 9,
            "share": 23.1,
            "sentiment": "unclassified",
            "sentiment_counts": {
              "unclassified": 9
            }
          },
          {
            "label": "Other reactions",
            "count": 6,
            "share": 15.4,
            "sentiment": "neutral",
            "sentiment_counts": {
              "neutral": 5,
              "positive": 1
            }
          },
          {
            "label": "Debate on hack-back and the law",
            "count": 5,
            "share": 12.8,
            "sentiment": "neutral",
            "sentiment_counts": {
              "neutral": 5
            }
          },
          {
            "label": "Attribution and technical detail",
            "count": 5,
            "share": 12.8,
            "sentiment": "neutral",
            "sentiment_counts": {
              "neutral": 3,
              "positive": 1,
              "negative": 1
            }
          },
          {
            "label": "Doubt about VPNs and zero trust",
            "count": 4,
            "share": 10.3,
            "sentiment": "neutral",
            "sentiment_counts": {
              "neutral": 2,
              "negative": 2
            }
          }
        ]
      },
      "why_line": "Edge devices hold credentials and keys that stay valid after a patch, so rotate them as well as update.",
      "short_name": "Edge devices",
      "cves": [
        "CVE-2026-114625",
        "CVE-2026-41709",
        "CVE-2026-76418"
      ],
      "cve_details": [
        {
          "id": "CVE-2026-114625",
          "exploited_in_wild": true,
          "source_ids": [
            "x2113346318953545907"
          ],
          "basis": "Arista confirms active attacks (The Hacker News)"
        },
        {
          "id": "CVE-2026-41709",
          "exploited_in_wild": true,
          "source_ids": [
            "x2115691636328169810"
          ],
          "basis": "CISA KEV (The Hacker News)"
        },
        {
          "id": "CVE-2026-76418",
          "exploited_in_wild": true,
          "source_ids": [
            "x2115757006145593440"
          ],
          "basis": "The Hacker News: Cisco patches an actively exploited flaw"
        }
      ],
      "exploited_in_wild": true
    },
    {
      "rank": 10,
      "key": "m365",
      "name": "Microsoft 365 identity attacks: token replay, Authenticator flaw, Teams help-desk scams",
      "summary": "Huntress tracked activity that compromised 97 Microsoft 365 accounts in 79 organisations through replayed stolen sign-in tokens. The attackers registered 48 rogue Entra devices and tampered with MFA settings. A separate Microsoft Authenticator flaw, now patched, let malicious Android apps impersonate Teams and get work tokens without permissions. Researchers tracked fake IT support on Teams that led to malware and ransomware.",
      "why": "Each case goes around MFA after sign-in. It does not defeat MFA. Thus detection moves to device registration events and MFA registration events.",
      "affected": {
        "products": "Microsoft 365 / Entra ID, Microsoft Authenticator for Android, Microsoft Teams",
        "sectors": "Enterprises in many sectors, MSP clients",
        "regions": "Global"
      },
      "vendors": [],
      "media": [
        "Dark Reading",
        "The Hacker News"
      ],
      "independent": [],
      "both_vendor_and_media": false,
      "distinct_accounts": 2,
      "x_engagement": 1336,
      "youtube_views": 0,
      "item_ids": [
        "x2114637788155154914",
        "x2115053633763196968",
        "x2114748385026777263",
        "x2115492562483949727"
      ],
      "key_items": [
        "x2114637788155154914",
        "x2115053633763196968",
        "x2114748385026777263",
        "x2115492562483949727"
      ],
      "comments": {
        "count": 37,
        "parents": [
          "https://x.com/i/status/2114637788155154914",
          "https://x.com/i/status/2115053633763196968"
        ],
        "sentiment": {
          "negative": 12,
          "neutral": 23,
          "unclassified": 1,
          "positive": 1
        },
        "clusters": [
          {
            "label": "Token theft bypasses MFA. Monitor device and MFA registration.",
            "count": 14,
            "share": 37.8,
            "sentiment": "neutral",
            "sentiment_counts": {
              "negative": 3,
              "neutral": 10,
              "positive": 1
            }
          },
          {
            "label": "\"No permissions needed\" concern",
            "count": 11,
            "share": 29.7,
            "sentiment": "negative",
            "sentiment_counts": {
              "negative": 7,
              "neutral": 4
            }
          },
          {
            "label": "Reactions",
            "count": 7,
            "share": 18.9,
            "sentiment": "neutral",
            "sentiment_counts": {
              "negative": 2,
              "neutral": 5
            }
          },
          {
            "label": "Update Authenticator and enforce versions through MDM",
            "count": 4,
            "share": 10.8,
            "sentiment": "neutral",
            "sentiment_counts": {
              "neutral": 4
            }
          },
          {
            "label": "Non-English comments (not classified)",
            "count": 1,
            "share": 2.7,
            "sentiment": "unclassified",
            "sentiment_counts": {
              "unclassified": 1
            }
          }
        ]
      },
      "why_line": "These attacks go around MFA after sign-in, so detection moves to device and MFA registration events.",
      "short_name": "M365 tokens",
      "cves": [],
      "cve_details": [],
      "exploited_in_wild": null
    }
  ],
  "ranking": [
    {
      "key": "php2shell",
      "accounts": 30,
      "x_eng": 17191,
      "yt_views": 1118751,
      "name": "PHP2Shell: critical PHP core RCE flaws (CVE-2026-109618 / -109619) and later flaws",
      "short_name": "PHP2Shell"
    },
    {
      "key": "aioffense",
      "accounts": 20,
      "x_eng": 1115,
      "yt_views": 607084,
      "name": "AI makes attacks faster: attacker AI tools and the \"Black October\" label",
      "short_name": "AI offence"
    },
    {
      "key": "brotli",
      "accounts": 11,
      "x_eng": 10825,
      "yt_views": 9536,
      "name": "Brotli decoder flaw CVE-2026-111497 (Node2Shell / HTTP2Shell)",
      "short_name": "Brotli CVE"
    },
    {
      "key": "tailscale",
      "accounts": 6,
      "x_eng": 2963,
      "yt_views": 4944,
      "name": "Tailscale SSH \"Tailworm\" privilege-escalation flaws",
      "short_name": "Tailworm"
    },
    {
      "key": "supplychain",
      "accounts": 6,
      "x_eng": 2349,
      "yt_views": 0,
      "name": "Developer supply-chain compromises: LiteLLM, Gheist, GhostAction, Railway",
      "short_name": "Supply chain"
    },
    {
      "key": "aiagents",
      "accounts": 4,
      "x_eng": 1726,
      "yt_views": 87,
      "name": "AI agent and AI-service security failures: AGENTS.md hijack, sandbox escapes, Cloudflare session leak",
      "short_name": "AI agents"
    },
    {
      "key": "breaches",
      "accounts": 4,
      "x_eng": 768,
      "yt_views": 0,
      "name": "Organisations disclose large data breaches: Capcom, Quest Diagnostics, Copenhagen, iRhythm, Bithumb and others",
      "short_name": "Breaches"
    },
    {
      "key": "apple",
      "accounts": 4,
      "x_eng": 492,
      "yt_views": 0,
      "name": "Apple CoreGraphics zero-day (CVE-2026-86950): Apple backports the patch to older iOS",
      "short_name": "Apple 0-day"
    },
    {
      "key": "edge",
      "accounts": 2,
      "x_eng": 3381,
      "yt_views": 0,
      "name": "Edge and network-device exploitation: k0t credential theft, Cisco SD-WAN KeyDrift, ASA/FTD, VeloCloud, ESXi",
      "short_name": "Edge devices"
    },
    {
      "key": "m365",
      "accounts": 2,
      "x_eng": 1336,
      "yt_views": 0,
      "name": "Microsoft 365 identity attacks: token replay, Authenticator flaw, Teams help-desk scams",
      "short_name": "M365 tokens"
    },
    {
      "key": "uefi",
      "accounts": 2,
      "x_eng": 860,
      "yt_views": 0,
      "name": "UEFI and Secure Boot bypasses",
      "short_name": "UEFI boot"
    },
    {
      "key": "healthcare",
      "accounts": 2,
      "x_eng": 22,
      "yt_views": 0,
      "name": "University of New Mexico Health cyberattack",
      "short_name": "UNM Health"
    },
    {
      "key": "linuxkernel",
      "accounts": 1,
      "x_eng": 1526,
      "yt_views": 0,
      "name": "Linux kernel flaws",
      "short_name": "Linux kernel"
    }
  ]
}
---
