import { i as __toESM } from "../_runtime.mjs";
import { m as platform } from "./endpoints-Dhw-Uhtx.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { y as require_jsx_runtime } from "../_libs/@radix-ui/react-accordion+[...].mjs";
import { O as Languages, R as Eye, ot as ArrowLeft, s as Sun, x as Moon, z as EyeOff } from "../_libs/lucide-react.mjs";
import { l as DropdownMenuTrigger, n as DropdownMenu, o as DropdownMenuRadioGroup, r as DropdownMenuContent, s as DropdownMenuRadioItem, t as Button, u as VukaLogo } from "./dropdown-menu-WnKjXFQ9.mjs";
import { t as Flag } from "./flags-fYmYFIMT.mjs";
import { r as useTheme } from "./theme-CRMezlZq.mjs";
import { i as useT, n as LANGUAGES, r as useI18n } from "./i18n-CuQ20qdj.mjs";
import { b as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { n as useQuery } from "../_libs/tanstack__react-query.mjs";
import { t as Input } from "./input-Lx3Itb5F.mjs";
import { n as Tilt, t as Sheet3D } from "./tilt-BCeSLHKR.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/password-field-Dn3Pqjn1.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
/** Language menu + theme toggle, for pages that don't carry the full site header. */
function SiteControls() {
	const t = useT();
	const { lang, setLang } = useI18n();
	const { resolved, setPreference } = useTheme();
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex items-center gap-1",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DropdownMenu, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DropdownMenuTrigger, {
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
		})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
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
		})]
	});
}
var PILLARS = [
	["Invoice-linked", "Every payment is bound to the invoice it settles."],
	["Escrow-backed", "Funds are committed before goods ship and released on evidence."],
	["Ledger-true", "Balances are derived from immutable double-entry postings."]
];
var FOOT = [
	["/terms", "Terms"],
	["/privacy", "Privacy"],
	["/security", "Security"],
	["/status", "Status"],
	["/support", "Help"]
];
var PANEL_PHOTO = {
	login: {
		src: "/images/landing/mombasa-port.webp",
		alt: "",
		location: "Mombasa, Kenya",
		credit: "Ian Kiptoo",
		license: "CC BY 4.0",
		sourceUrl: "https://commons.wikimedia.org/wiki/File:Container_ship_exiting_Mombasa_port,_Kenya_01.jpg"
	},
	register: {
		src: "/images/landing/mpesa-agent.webp",
		alt: "",
		location: "Nairobi, Kenya",
		credit: "Fiona Graham",
		license: "CC BY-SA 2.0",
		sourceUrl: "https://commons.wikimedia.org/wiki/File:M-PESA_mobile_money_and_Equity_agent,_Nairobi,_Kenya.jpg"
	}
};
/**
* Split-screen frame shared by /login and /register. The left column is the form; the right panel
* shows an illustrative receipt on a 3D paper stack, the launch markets, and what the platform enforces.
*/
function AuthFrame({ children, variant = "login", wide = false }) {
	const markets = useQuery({
		queryKey: ["public-config"],
		queryFn: platform.config,
		staleTime: 3e5,
		retry: false
	}).data?.countries ?? [];
	const isReg = variant === "register";
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "grid min-h-screen bg-background text-foreground lg:grid-cols-[minmax(460px,640px)_1fr]",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex min-h-screen flex-col border-border lg:border-r",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center justify-between px-6 py-4 sm:px-12",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
						to: "/",
						className: "inline-flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowLeft, {
							className: "size-3.5",
							"aria-hidden": "true"
						}), " Back to home"]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SiteControls, {})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: `mx-auto flex w-full flex-1 flex-col justify-center px-6 py-8 sm:px-12 ${wide ? "max-w-2xl" : "max-w-xl"}`,
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
							to: "/",
							className: "mb-10 block",
							"aria-label": "VUKA — home",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(VukaLogo, {
								size: "lg",
								tagline: "Rise & Cross Over"
							})
						}),
						children,
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
							className: "mt-12 grid gap-3 border-t border-border pt-6 text-xs text-muted-foreground lg:hidden",
							children: PILLARS.map(([h, b]) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", { children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "font-mono uppercase tracking-[0.14em] text-foreground",
									children: h
								}),
								" —",
								" ",
								b
							] }, h))
						})
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("footer", {
					className: "border-t border-border px-6 py-4 text-[11px] text-muted-foreground sm:px-12",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("nav", {
						"aria-label": "Legal and help",
						className: "flex flex-wrap gap-x-4 gap-y-1",
						children: FOOT.map(([to, l]) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
							to,
							className: "underline-offset-4 hover:text-foreground hover:underline",
							children: l
						}, to))
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "mt-2",
						children: [
							"Sandbox environment. No real money moves. © ",
							(/* @__PURE__ */ new Date()).getFullYear(),
							" VUKA"
						]
					})]
				})
			]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("aside", {
			className: "relative hidden flex-col justify-between overflow-hidden bg-foreground p-12 text-background lg:flex",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
					src: PANEL_PHOTO[isReg ? "register" : "login"].src,
					alt: "",
					"aria-hidden": "true",
					loading: "eager",
					decoding: "async",
					className: "absolute inset-0 size-full object-cover opacity-45 grayscale contrast-[1.08]"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					"aria-hidden": "true",
					className: "absolute inset-0 bg-foreground/80"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "relative flex items-center gap-3 font-mono text-[10px] uppercase tracking-[0.3em] opacity-70",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						"aria-hidden": "true",
						className: "h-px w-10 bg-background"
					}), "Continental cross-border payments"]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "relative",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
							className: "max-w-lg font-display text-5xl font-normal leading-[1.05] tracking-tight",
							children: isReg ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
								"Open an account. ",
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("em", { children: "Your first quote" }),
								" is minutes away."
							] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
								"Trade across borders on trust that is ",
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("em", { children: "enforced" }),
								"."
							] })
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Tilt, {
							className: "mt-12 h-[250px] max-w-md",
							max: 7,
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								"aria-hidden": "true",
								className: "relative size-full text-card-foreground",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Sheet3D, {
										z: 0,
										className: "absolute inset-x-8 top-10 h-[190px] opacity-75"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Sheet3D, {
										z: 30,
										className: "absolute inset-x-4 top-5 h-[190px] opacity-80"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Sheet3D, {
										z: 64,
										className: "absolute inset-x-0 top-0 h-[200px] p-5 font-mono text-xs",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "flex justify-between border-b border-dashed border-border pb-2 text-[10px] uppercase tracking-[0.2em] text-muted-foreground",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Settlement receipt" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Illustrative" })]
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("dl", {
											className: "mt-3 space-y-2",
											children: [
												/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
													className: "flex justify-between",
													children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", {
														className: "text-muted-foreground",
														children: "Sent"
													}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", {
														className: "tabular",
														children: "RWF 500,000"
													})]
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
													className: "flex justify-between",
													children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", {
														className: "text-muted-foreground",
														children: "Fee · 0.80%"
													}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", {
														className: "tabular",
														children: "RWF 4,000"
													})]
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
													className: "flex justify-between",
													children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", {
														className: "text-muted-foreground",
														children: "Escrow"
													}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", { children: "Released ✓" })]
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
													className: "flex items-baseline justify-between border-t border-dashed border-border pt-2",
													children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", { children: "Delivered" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", {
														className: "tabular font-display text-2xl",
														children: "KES 46,100"
													})]
												})
											]
										})]
									})
								]
							})
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
							className: "mt-12 grid max-w-lg gap-5 sm:grid-cols-3",
							children: PILLARS.map(([h, b]) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
								className: "border-t border-background/30 pt-3",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "font-mono text-[10px] uppercase tracking-[0.18em]",
									children: h
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "mt-1 text-xs opacity-70",
									children: b
								})]
							}, h))
						})
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "relative",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
						className: "flex flex-wrap gap-x-3 gap-y-2 font-mono text-[10px] uppercase tracking-[0.18em] opacity-80",
						children: markets.map((m) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
							className: "flex items-center gap-1.5",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Flag, {
								code: m.code,
								className: "w-4 shrink-0 shadow-sm"
							}), m.name]
						}, m.code))
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-3 flex items-baseline justify-between font-mono text-[10px] uppercase tracking-[0.2em] opacity-75",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Sandbox environment" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("a", {
							href: PANEL_PHOTO[isReg ? "register" : "login"].sourceUrl,
							target: "_blank",
							rel: "noopener noreferrer nofollow",
							className: "opacity-70 hover:opacity-100 hover:underline",
							children: [
								PANEL_PHOTO[isReg ? "register" : "login"].location,
								" ·",
								" ",
								PANEL_PHOTO[isReg ? "register" : "login"].credit,
								" ·",
								" ",
								PANEL_PHOTO[isReg ? "register" : "login"].license
							]
						})]
					})]
				})
			]
		})]
	});
}
/** Password input with a show/hide toggle and an optional caps-lock warning. */
function PasswordField({ warnCaps = true, ...props }) {
	const [shown, setShown] = (0, import_react.useState)(false);
	const [caps, setCaps] = (0, import_react.useState)(false);
	const track = (e) => setCaps(e.getModifierState("CapsLock"));
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "relative",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
			...props,
			type: shown ? "text" : "password",
			className: `rounded-none pr-11 ${props.className ?? ""}`,
			onKeyUp: track,
			onKeyDown: track,
			onBlur: (e) => {
				setCaps(false);
				props.onBlur?.(e);
			}
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
			type: "button",
			onClick: () => setShown((s) => !s),
			"aria-pressed": shown,
			"aria-label": shown ? "Hide password" : "Show password",
			className: "absolute inset-y-0 right-0 flex w-10 items-center justify-center text-muted-foreground hover:text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring",
			children: shown ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(EyeOff, {
				className: "size-4",
				"aria-hidden": "true"
			}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Eye, {
				className: "size-4",
				"aria-hidden": "true"
			})
		})]
	}), warnCaps && caps ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
		role: "status",
		className: "mt-1.5 font-mono text-[11px]",
		children: "Caps Lock is on."
	}) : null] });
}
/** Rough, transparent strength estimate: length and character variety, with common-pattern penalties. */
function passwordStrength(pw) {
	if (!pw) return {
		score: 0,
		label: "Empty",
		hint: "Use at least 8 characters."
	};
	let s = 0;
	if (pw.length >= 8) s++;
	if (pw.length >= 12) s++;
	if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) s++;
	if (/\d/.test(pw) && /[^A-Za-z0-9]/.test(pw)) s++;
	if (/^(.)\1+$/.test(pw) || /^(password|12345678|qwerty|vuka)/i.test(pw)) s = Math.min(s, 1);
	if (pw.length < 8) s = 0;
	const score = Math.min(4, s);
	return {
		score,
		label: [
			"Too short",
			"Weak",
			"Fair",
			"Good",
			"Strong"
		][score],
		hint: pw.length < 8 ? "Use at least 8 characters." : score < 3 ? "Add length (12+), mixed case, a digit and a symbol." : "Good. A passphrase of several words is easy to remember and hard to guess."
	};
}
function StrengthMeter({ password }) {
	const { score, label, hint } = passwordStrength(password);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		"aria-live": "polite",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "flex gap-1",
			"aria-hidden": "true",
			children: [
				1,
				2,
				3,
				4
			].map((n) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: `h-1.5 flex-1 border border-foreground ${n <= score ? "bg-foreground" : ""}` }, n))
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
			className: "mt-1.5 text-xs text-muted-foreground",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "font-mono uppercase tracking-[0.12em] text-foreground",
					children: label
				}),
				" ·",
				" ",
				hint
			]
		})]
	});
}
//#endregion
export { passwordStrength as i, PasswordField as n, StrengthMeter as r, AuthFrame as t };
