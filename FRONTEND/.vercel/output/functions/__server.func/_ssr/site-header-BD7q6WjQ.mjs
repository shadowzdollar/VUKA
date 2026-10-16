import { i as __toESM } from "../_runtime.mjs";
import { m as platform } from "./endpoints-Dhw-Uhtx.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { y as require_jsx_runtime } from "../_libs/@radix-ui/react-accordion+[...].mjs";
import { O as Languages, rt as ArrowUp, s as Sun, w as Menu, x as Moon } from "../_libs/lucide-react.mjs";
import { l as DropdownMenuTrigger, n as DropdownMenu, o as DropdownMenuRadioGroup, r as DropdownMenuContent, s as DropdownMenuRadioItem, t as Button, u as VukaLogo } from "./dropdown-menu-WnKjXFQ9.mjs";
import { t as Flag } from "./flags-fYmYFIMT.mjs";
import { r as useTheme } from "./theme-CRMezlZq.mjs";
import { i as useT, n as LANGUAGES, r as useI18n } from "./i18n-CuQ20qdj.mjs";
import { i as SheetTitle, n as SheetContent, r as SheetDescription, t as Sheet } from "./sheet-DUJ976EN.mjs";
import { b as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { n as useQuery } from "../_libs/tanstack__react-query.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/site-header-BD7q6WjQ.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function Photo({ src, alt, width, height, credit, className, imgClassName }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("figure", {
		className,
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "overflow-hidden border border-border bg-muted/30",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
				src,
				alt,
				width,
				height,
				loading: "lazy",
				decoding: "async",
				className: `size-full object-cover grayscale contrast-[1.08] ${imgClassName ?? ""}`
			})
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("figcaption", {
			className: "mt-2 flex items-baseline justify-between gap-3 font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: credit.location }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("a", {
				href: credit.sourceUrl,
				target: "_blank",
				rel: "noopener noreferrer nofollow",
				className: "shrink-0 underline-offset-2 hover:underline",
				children: [
					credit.credit,
					" · ",
					credit.license
				]
			})]
		})]
	});
}
var COLUMNS = [
	{
		title: "Product",
		links: [
			{
				label: "How a payment works",
				href: "/#journey"
			},
			{
				label: "Cost estimator",
				href: "/#estimate"
			},
			{
				label: "Escrow explained",
				href: "/#escrow"
			},
			{
				label: "VUKA on mobile",
				href: "/#mobile"
			},
			{
				label: "Markets and corridors",
				href: "/#markets"
			},
			{
				label: "Trust score lab",
				href: "/#trust"
			},
			{
				label: "Questions",
				href: "/#faq"
			}
		]
	},
	{
		title: "For traders",
		links: [
			{
				label: "Open an account",
				to: "/register"
			},
			{
				label: "Sign in",
				to: "/login"
			},
			{
				label: "Send a payment",
				to: "/send"
			},
			{
				label: "Invoices",
				to: "/escrow"
			},
			{
				label: "Verification and limits",
				to: "/verification"
			},
			{
				label: "Help and support",
				to: "/support"
			}
		]
	},
	{
		title: "Trust and security",
		links: [
			{
				label: "Security practices",
				to: "/security"
			},
			{
				label: "System status",
				to: "/status"
			},
			{
				label: "Data protection",
				to: "/privacy"
			},
			{
				label: "How disputes are resolved",
				href: "/#escrow"
			},
			{
				label: "Report a vulnerability",
				to: "/security"
			}
		]
	},
	{
		title: "Company",
		links: [
			{
				label: "About VUKA",
				to: "/about"
			},
			{
				label: "Principles",
				href: "/about#principles"
			},
			{
				label: "Roadmap",
				href: "/about#roadmap"
			},
			{
				label: "Accessibility",
				href: "/about#accessibility"
			},
			{
				label: "Contact",
				href: "/about#contact"
			}
		]
	},
	{
		title: "Legal",
		links: [
			{
				label: "Terms of use",
				to: "/terms"
			},
			{
				label: "Privacy notice",
				to: "/privacy"
			},
			{
				label: "Cookies and storage",
				href: "/privacy#storage"
			}
		]
	}
];
function FooterAnchor({ l }) {
	const cls = "text-sm text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline";
	return l.to ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
		to: l.to,
		className: cls,
		children: l.label
	}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
		href: l.href,
		className: cls,
		children: l.label
	});
}
function SiteFooter() {
	const { lang, setLang } = useI18n();
	const { resolved, setPreference } = useTheme();
	const markets = useQuery({
		queryKey: ["public-config"],
		queryFn: platform.config,
		staleTime: 3e5,
		retry: false
	}).data?.countries ?? [];
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("footer", {
		className: "border-t border-border bg-muted/30",
		"data-app-chrome": true,
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mx-auto px-4 pt-14 sm:px-6 lg:px-10 2xl:px-16",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "grid gap-12 lg:grid-cols-[1.3fr_2fr]",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(VukaLogo, {
							size: "xl",
							tagline: "Rise & Cross Over"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "mt-5 max-w-sm font-display text-xl leading-snug",
							children: [
								"Trade across borders on trust that is ",
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("em", { children: "enforced" }),
								", not just displayed."
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-4 max-w-sm text-sm text-muted-foreground",
							children: "VUKA is the settlement layer between African mobile money and real trade: invoice-linked payments, escrow, firm FX quotes and a ledger both sides can cite."
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "mt-6 flex flex-wrap items-center gap-2",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
									className: "sr-only",
									htmlFor: "footer-lang",
									children: "Language"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("select", {
									id: "footer-lang",
									value: lang,
									onChange: (e) => setLang(e.target.value),
									className: "h-9 border border-border bg-background px-2 font-mono text-xs",
									children: LANGUAGES.map((l) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
										value: l.code,
										children: l.native
									}, l.code))
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
									variant: "outline",
									size: "sm",
									className: "h-9 gap-2 rounded-none font-mono text-[11px] uppercase",
									onClick: () => setPreference(resolved === "dark" ? "light" : "dark"),
									children: [
										resolved === "dark" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Sun, {
											className: "size-3.5",
											"aria-hidden": "true"
										}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Moon, {
											className: "size-3.5",
											"aria-hidden": "true"
										}),
										resolved === "dark" ? "Light" : "Dark",
										" theme"
									]
								})
							]
						})
					] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("nav", {
						"aria-label": "Footer",
						className: "grid grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-3 lg:grid-cols-5",
						children: COLUMNS.map((col) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
							className: "font-mono text-[10px] uppercase tracking-[0.22em]",
							children: col.title
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
							className: "mt-4 space-y-2.5",
							children: col.links.map((l) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(FooterAnchor, { l }) }, l.label))
						})] }, col.title))
					})]
				}),
				markets.length ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-12 border-t border-border pt-6",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "font-mono text-[10px] uppercase tracking-[0.22em]",
						children: "Launch markets"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
						className: "mt-3 flex flex-wrap gap-x-5 gap-y-1.5 text-sm text-muted-foreground",
						children: markets.map((m) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
							className: "flex items-center gap-1.5",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Flag, {
									code: m.code,
									className: "w-4 shrink-0"
								}),
								m.name,
								" ",
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "font-mono text-[11px]",
									children: m.currency
								})
							]
						}, m.code))
					})]
				}) : null,
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-8 border border-dashed border-border p-4 text-xs text-muted-foreground",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", {
						className: "font-medium text-foreground",
						children: "Sandbox environment."
					}), " This deployment uses simulated payment rails and indicative reference exchange rates; no live funds move. VUKA is not a licensed payment provider in any jurisdiction, and nothing on this site is financial advice or an offer of services. Operating each corridor requires the relevant licences and partner agreements."]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-8 flex flex-wrap items-center justify-between gap-4 border-t border-border py-6",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground",
						children: [
							"© ",
							(/* @__PURE__ */ new Date()).getFullYear(),
							" VUKA · Built for African traders"
						]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center gap-5 text-xs",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
								to: "/terms",
								className: "underline-offset-4 hover:underline",
								children: "Terms"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
								to: "/privacy",
								className: "underline-offset-4 hover:underline",
								children: "Privacy"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
								to: "/status",
								className: "underline-offset-4 hover:underline",
								children: "Status"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
								type: "button",
								onClick: () => window.scrollTo({
									top: 0,
									behavior: "smooth"
								}),
								className: "inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.18em] hover:underline",
								children: ["Back to top ", /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowUp, {
									className: "size-3",
									"aria-hidden": "true"
								})]
							})
						]
					})]
				})
			]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			"aria-hidden": "true",
			className: "select-none overflow-hidden border-t border-border",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				"data-word": "vuka",
				className: "mx-auto whitespace-nowrap px-4 text-center font-display text-[24vw] leading-[0.8] tracking-tight text-foreground/[0.06] before:content-[attr(data-word)] sm:px-6 lg:px-10 2xl:px-16 lg:text-[15rem]"
			})
		})]
	});
}
var NAV = [
	{
		href: "/#journey",
		label: "How it works"
	},
	{
		href: "/#estimate",
		label: "Cost estimator"
	},
	{
		href: "/#escrow",
		label: "Escrow"
	},
	{
		href: "/#mobile",
		label: "On mobile"
	},
	{
		href: "/#markets",
		label: "Markets"
	},
	{
		href: "/#trust",
		label: "Trust score"
	},
	{
		href: "/#faq",
		label: "FAQ"
	}
];
function SiteHeader() {
	const t = useT();
	const { lang, setLang } = useI18n();
	const { resolved, setPreference } = useTheme();
	const [open, setOpen] = (0, import_react.useState)(false);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
		className: "sticky top-0 z-40 border-b border-border bg-background/90 backdrop-blur",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mx-auto flex items-center gap-3 px-4 py-3 sm:px-6 lg:px-10 2xl:px-16",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					variant: "ghost",
					size: "icon",
					className: "size-9 rounded-none xl:hidden",
					"aria-label": t("shell.menu"),
					onClick: () => setOpen(true),
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Menu, {
						className: "size-5",
						"aria-hidden": "true"
					})
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
					to: "/",
					"aria-label": "VUKA — home",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(VukaLogo, { tagline: t("app.tagline") })
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("nav", {
					"aria-label": "Site",
					className: "ml-6 hidden items-center gap-1 xl:flex",
					children: NAV.map((n) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
						href: n.href,
						className: "whitespace-nowrap px-2.5 py-2 text-sm text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline",
						children: n.label
					}, n.href))
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "ml-auto flex items-center gap-1.5",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DropdownMenu, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DropdownMenuTrigger, {
							asChild: true,
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
								variant: "ghost",
								size: "sm",
								className: "h-9 gap-1.5 rounded-none font-mono text-[11px] uppercase",
								"aria-label": t("shell.language"),
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Languages, {
										className: "size-4",
										"aria-hidden": "true"
									}),
									" ",
									lang
								]
							})
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DropdownMenuContent, {
							align: "end",
							className: "rounded-none",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DropdownMenuRadioGroup, {
								value: lang,
								onValueChange: (v) => setLang(v),
								children: LANGUAGES.map((l) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DropdownMenuRadioItem, {
									value: l.code,
									children: l.native
								}, l.code))
							})
						})] }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							variant: "ghost",
							size: "icon",
							className: "size-9 rounded-none",
							"aria-label": t("shell.theme"),
							onClick: () => setPreference(resolved === "dark" ? "light" : "dark"),
							children: resolved === "dark" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Sun, {
								className: "size-4",
								"aria-hidden": "true"
							}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Moon, {
								className: "size-4",
								"aria-hidden": "true"
							})
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							asChild: true,
							variant: "outline",
							size: "sm",
							className: "hidden rounded-none font-mono text-[11px] uppercase sm:inline-flex",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
								to: "/login",
								children: t("landing.cta.signin")
							})
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							asChild: true,
							size: "sm",
							className: "rounded-none font-mono text-[11px] uppercase",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
								to: "/register",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "sm:hidden",
									children: "Join"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "hidden sm:inline",
									children: t("landing.cta.register")
								})]
							})
						})
					]
				})
			]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Sheet, {
			open,
			onOpenChange: setOpen,
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SheetContent, {
				side: "left",
				className: "w-72 rounded-none p-0",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SheetTitle, {
						className: "sr-only",
						children: t("shell.menu")
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SheetDescription, {
						className: "sr-only",
						children: "Site navigation"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("nav", {
						"aria-label": "Site (mobile)",
						className: "flex flex-col p-5 pt-12",
						children: [NAV.map((n) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
							href: n.href,
							onClick: () => setOpen(false),
							className: "border-b border-border py-3 text-base",
							children: n.label
						}, n.href)), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
							to: "/login",
							onClick: () => setOpen(false),
							className: "border-b border-border py-3 text-base",
							children: t("landing.cta.signin")
						})]
					})
				]
			})
		})]
	});
}
//#endregion
export { SiteFooter as n, SiteHeader as r, Photo as t };
