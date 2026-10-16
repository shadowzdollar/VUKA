import { i as __toESM } from "../_runtime.mjs";
import { c as invoices, g as support, n as api, u as ledger } from "./endpoints-Dhw-Uhtx.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { y as require_jsx_runtime } from "../_libs/@radix-ui/react-accordion+[...].mjs";
import { D as LayoutDashboard, E as LifeBuoy, M as Globe, N as Gauge, O as Languages, P as FileText, S as Monitor, T as LogOut, W as ClipboardCheck, Z as ChevronDown, _ as Scale, et as ChartColumn, g as Search, h as Send, k as Landmark, lt as Activity, nt as Bell, p as ShieldCheck, r as Wallet, s as Sun, t as X, w as Menu, x as Moon } from "../_libs/lucide-react.mjs";
import { a as DialogOverlay$1, i as DialogDescription$1, n as DialogClose, o as DialogPortal$1, r as DialogContent$1, s as DialogTitle$1, t as Dialog$1 } from "../_libs/@radix-ui/react-dialog+[...].mjs";
import { a as DropdownMenuLabel, c as DropdownMenuSeparator, d as cn, i as DropdownMenuItem, l as DropdownMenuTrigger, n as DropdownMenu, o as DropdownMenuRadioGroup, r as DropdownMenuContent, s as DropdownMenuRadioItem, t as Button, u as VukaLogo } from "./dropdown-menu-WnKjXFQ9.mjs";
import { r as useTheme } from "./theme-CRMezlZq.mjs";
import { i as useT, n as LANGUAGES, r as useI18n } from "./i18n-CuQ20qdj.mjs";
import { i as SheetTitle, n as SheetContent, r as SheetDescription, t as Sheet } from "./sheet-DUJ976EN.mjs";
import { b as Link, p as useRouterState, x as useNavigate } from "../_libs/@tanstack/react-router+[...].mjs";
import { n as useQuery } from "../_libs/tanstack__react-query.mjs";
import { i as useTrader, r as useSession } from "./session-DisxoMRQ.mjs";
import { t as _e } from "../_libs/cmdk.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/shell-TFIi8X1Z.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var Dialog = Dialog$1;
var DialogPortal = DialogPortal$1;
var DialogOverlay = import_react.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogOverlay$1, {
	ref,
	className: cn("fixed inset-0 z-50 bg-black/80  data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0", className),
	...props
}));
DialogOverlay.displayName = DialogOverlay$1.displayName;
var DialogContent = import_react.forwardRef(({ className, children, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogPortal, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogOverlay, {}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogContent$1, {
	ref,
	className: cn("fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 sm:rounded-lg", className),
	...props,
	children: [children, /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogClose, {
		className: "absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background cursor-pointer transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { className: "h-4 w-4" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: "sr-only",
			children: "Close"
		})]
	})]
})] }));
DialogContent.displayName = DialogContent$1.displayName;
var DialogHeader = ({ className, ...props }) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
	className: cn("flex flex-col space-y-1.5 text-center sm:text-left", className),
	...props
});
DialogHeader.displayName = "DialogHeader";
var DialogFooter = ({ className, ...props }) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
	className: cn("flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2", className),
	...props
});
DialogFooter.displayName = "DialogFooter";
var DialogTitle = import_react.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogTitle$1, {
	ref,
	className: cn("text-lg font-semibold leading-none tracking-tight", className),
	...props
}));
DialogTitle.displayName = DialogTitle$1.displayName;
var DialogDescription = import_react.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogDescription$1, {
	ref,
	className: cn("text-sm text-muted-foreground", className),
	...props
}));
DialogDescription.displayName = DialogDescription$1.displayName;
var Command$1 = import_react.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(_e, {
	ref,
	className: cn("flex h-full w-full flex-col overflow-hidden rounded-md bg-popover text-popover-foreground", className),
	...props
}));
Command$1.displayName = _e.displayName;
var CommandDialog = ({ children, ...props }) => {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Dialog, {
		...props,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogContent, {
			className: "overflow-hidden p-0",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Command$1, {
				className: "[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-muted-foreground [&_[cmdk-group]:not([hidden])_~[cmdk-group]]:pt-0 [&_[cmdk-group]]:px-2 [&_[cmdk-input-wrapper]_svg]:h-5 [&_[cmdk-input-wrapper]_svg]:w-5 [&_[cmdk-input]]:h-12 [&_[cmdk-item]]:px-2 [&_[cmdk-item]]:py-3 [&_[cmdk-item]_svg]:h-5 [&_[cmdk-item]_svg]:w-5",
				children
			})
		})
	});
};
var CommandInput = import_react.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
	className: "flex items-center border-b px-3",
	"cmdk-input-wrapper": "",
	children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Search, { className: "mr-2 h-4 w-4 shrink-0 opacity-50" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(_e.Input, {
		ref,
		className: cn("flex h-10 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50", className),
		...props
	})]
}));
CommandInput.displayName = _e.Input.displayName;
var CommandList = import_react.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(_e.List, {
	ref,
	className: cn("max-h-[300px] overflow-y-auto overflow-x-hidden", className),
	...props
}));
CommandList.displayName = _e.List.displayName;
var CommandEmpty = import_react.forwardRef((props, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(_e.Empty, {
	ref,
	className: "py-6 text-center text-sm",
	...props
}));
CommandEmpty.displayName = _e.Empty.displayName;
var CommandGroup = import_react.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(_e.Group, {
	ref,
	className: cn("overflow-hidden p-1 text-foreground [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-muted-foreground", className),
	...props
}));
CommandGroup.displayName = _e.Group.displayName;
var CommandSeparator = import_react.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(_e.Separator, {
	ref,
	className: cn("-mx-1 h-px bg-border", className),
	...props
}));
CommandSeparator.displayName = _e.Separator.displayName;
var CommandItem = import_react.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(_e.Item, {
	ref,
	className: cn("relative flex cursor-default gap-2 select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none data-[disabled=true]:pointer-events-none data-[selected=true]:bg-accent data-[selected=true]:text-accent-foreground data-[disabled=true]:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0", className),
	...props
}));
CommandItem.displayName = _e.Item.displayName;
var CommandShortcut = ({ className, ...props }) => {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
		className: cn("ml-auto text-xs tracking-widest text-muted-foreground", className),
		...props
	});
};
CommandShortcut.displayName = "CommandShortcut";
/** Grouped navigation used by both the desktop sidebar and the mobile drawer. */
function NavList({ groups, onNavigate }) {
	const t = useT();
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "space-y-6",
		children: groups.map((group) => {
			const headingId = `nav-group-${group.labelKey}`;
			return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				role: "group",
				"aria-labelledby": headingId,
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					id: headingId,
					className: "px-3 pb-1.5 font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground",
					children: t(group.labelKey)
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
					className: "space-y-0.5",
					children: group.items.map((item) => {
						const Icon = item.icon;
						return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
							to: item.to,
							preload: "intent",
							onClick: onNavigate,
							activeOptions: { exact: item.exact ?? false },
							className: "group flex items-center gap-3 border-l-2 border-transparent px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground",
							activeProps: { className: "border-foreground bg-accent text-foreground font-medium" },
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, {
								className: "size-4 shrink-0",
								"aria-hidden": "true"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "truncate",
								children: t(item.labelKey)
							})]
						}) }, item.to);
					})
				})]
			}, group.labelKey);
		})
	});
}
var traderNav = [
	{
		labelKey: "nav.group.money",
		items: [
			{
				to: "/",
				labelKey: "nav.overview",
				icon: LayoutDashboard,
				exact: true
			},
			{
				to: "/wallets",
				labelKey: "nav.wallets",
				icon: Wallet
			},
			{
				to: "/send",
				labelKey: "nav.send",
				icon: Send
			},
			{
				to: "/escrow",
				labelKey: "nav.invoices",
				icon: FileText
			}
		]
	},
	{
		labelKey: "nav.group.trust",
		items: [
			{
				to: "/trust-score",
				labelKey: "nav.trust",
				icon: Gauge
			},
			{
				to: "/analytics",
				labelKey: "nav.insights",
				icon: ChartColumn
			},
			{
				to: "/verification",
				labelKey: "nav.verification",
				icon: ClipboardCheck
			}
		]
	},
	{
		labelKey: "nav.group.network",
		items: [{
			to: "/corridors",
			labelKey: "nav.corridors",
			icon: Globe
		}, {
			to: "/support",
			labelKey: "nav.support",
			icon: LifeBuoy
		}]
	}
];
var operatorNav = [
	{
		labelKey: "nav.group.operations",
		items: [
			{
				to: "/",
				labelKey: "nav.cockpit",
				icon: LayoutDashboard,
				exact: true
			},
			{
				to: "/escrow",
				labelKey: "nav.escrow",
				icon: Landmark
			},
			{
				to: "/disputes",
				labelKey: "nav.disputes",
				icon: Scale
			},
			{
				to: "/analytics",
				labelKey: "nav.intelligence",
				icon: ChartColumn
			},
			{
				to: "/settlements",
				labelKey: "nav.settlements",
				icon: Send
			}
		]
	},
	{
		labelKey: "nav.group.governance",
		items: [{
			to: "/compliance",
			labelKey: "nav.compliance",
			icon: ShieldCheck
		}, {
			to: "/activity",
			labelKey: "nav.activity",
			icon: Activity
		}]
	},
	{
		labelKey: "nav.group.network",
		items: [{
			to: "/corridors",
			labelKey: "nav.providers",
			icon: Globe
		}]
	}
];
/**
* Client-side inactivity guard for shared devices (common in markets and agent shops). After
* `idleMs` without input a warning appears; if not dismissed within `graceMs` the session ends.
* The server session (12 h) remains the authority — this only ends it sooner.
*/
function useIdleTimeout(opts) {
	const { enabled, idleMs, graceMs, onExpire } = opts;
	const [secondsLeft, setSecondsLeft] = (0, import_react.useState)(null);
	const lastActivity = (0, import_react.useRef)(Date.now());
	const expire = (0, import_react.useRef)(onExpire);
	expire.current = onExpire;
	const secondsLeftRef = (0, import_react.useRef)(null);
	secondsLeftRef.current = secondsLeft;
	const stay = (0, import_react.useCallback)(() => {
		lastActivity.current = Date.now();
		setSecondsLeft(null);
	}, []);
	(0, import_react.useEffect)(() => {
		if (!enabled) return;
		const bump = () => {
			if (secondsLeftRef.current === null) lastActivity.current = Date.now();
		};
		const events = [
			"pointerdown",
			"keydown",
			"touchstart",
			"scroll"
		];
		for (const e of events) window.addEventListener(e, bump, { passive: true });
		const tick = window.setInterval(() => {
			const idle = Date.now() - lastActivity.current;
			if (idle >= idleMs + graceMs) expire.current();
			else if (idle >= idleMs) setSecondsLeft(Math.ceil((idleMs + graceMs - idle) / 1e3));
		}, 1e3);
		return () => {
			for (const e of events) window.removeEventListener(e, bump);
			window.clearInterval(tick);
		};
	}, [
		enabled,
		idleMs,
		graceMs
	]);
	return {
		warning: secondsLeft !== null,
		secondsLeft: secondsLeft ?? 0,
		stay
	};
}
/** Accounts + derived balances for the signed-in trader. Invalidate ["wallet"] after any payment. */
function useWallet() {
	const trader = useTrader();
	return useQuery({
		queryKey: ["wallet", trader.id],
		queryFn: async () => {
			const accounts = await ledger.accounts(trader.id);
			const list = await Promise.all(accounts.map((a) => ledger.balance(a.id)));
			return {
				accounts,
				balances: Object.fromEntries(list.map((b) => [b.account_id, b]))
			};
		}
	});
}
function useTransfers(filter) {
	const trader = useTrader();
	return useQuery({
		queryKey: [
			"transfers",
			trader.id,
			filter ?? {}
		],
		queryFn: () => ledger.transfers(trader.id, filter)
	});
}
function useInvoices(direction) {
	const trader = useTrader();
	return useQuery({
		queryKey: [
			"invoices",
			trader.id,
			direction ?? "all"
		],
		queryFn: () => invoices.list(trader.id, direction)
	});
}
function useNotifications() {
	const trader = useTrader();
	return useQuery({
		queryKey: ["notifications", trader.id],
		queryFn: () => support.notifications(),
		refetchInterval: 3e4
	});
}
/** "Debit"/"credit" from the viewpoint of a set of the trader's own accounts. */
function directionFor(t, ownAccountIds) {
	const src = ownAccountIds.has(t.source_account_id);
	const dst = ownAccountIds.has(t.destination_account_id);
	if (src && dst) return "internal";
	return src ? "out" : "in";
}
/** A human label for an account, consistent everywhere one is shown. */
var accountLabel = (a) => `${a.type === "BUSINESS" ? "Business trade wallet" : a.type === "PERSONAL" ? "Personal wallet" : a.type} · ${a.currency}`;
function Chip({ children, tone = "neutral" }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
		className: cn("inline-flex items-center gap-1.5 border px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.14em]", tone === "neutral" && "border-border text-muted-foreground", tone === "live" && "border-foreground/50 text-foreground", tone === "warn" && "border-2 border-foreground text-foreground", tone === "dead" && "border-border text-muted-foreground/60 line-through", tone === "invert" && "border-foreground bg-foreground text-background"),
		children
	});
}
function Panel({ title, meta, children, className }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
		className: cn("min-w-0 border border-border bg-card", className),
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
			className: "flex flex-wrap items-center justify-between gap-2 border-b border-border px-4 py-2.5",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
				className: "font-mono text-[11px] uppercase tracking-[0.22em] text-muted-foreground",
				children: title
			}), meta ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "flex items-center gap-2",
				children: meta
			}) : null]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "p-4",
			children
		})]
	});
}
function Metric({ label, value, sub, trend }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "border border-border bg-card px-4 py-3.5",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground",
				children: label
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mt-2 font-mono text-2xl tabular-nums tracking-tight text-foreground",
				children: value
			}),
			trend ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mt-2 text-foreground",
				children: trend
			}) : null,
			sub ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mt-1 text-xs text-muted-foreground",
				children: sub
			}) : null
		]
	});
}
function PageHeader({ eyebrow, title, description, actions }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex flex-wrap items-end justify-between gap-4 border-b border-border pb-5",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground",
				children: eyebrow
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
				className: "mt-2 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl",
				children: title
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-2 max-w-2xl text-sm text-muted-foreground",
				children: description
			})
		] }), actions ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "flex flex-wrap gap-2",
			children: actions
		}) : null]
	});
}
/** Live liveness probe of the engine (GET /healthz). */
function EngineChip() {
	const t = useT();
	const q = useQuery({
		queryKey: ["healthz"],
		queryFn: () => api.get("/healthz"),
		refetchInterval: 3e4,
		retry: false
	});
	if (q.isPending) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Chip, { children: "…" });
	return q.isError ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Chip, {
		tone: "warn",
		children: t("shell.engine.down")
	}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Chip, {
		tone: "live",
		children: t("shell.engine.online")
	});
}
function TraderBell() {
	const t = useT();
	const unread = (useNotifications().data ?? []).filter((n) => !n.read_at).length;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
		asChild: true,
		variant: "ghost",
		size: "icon",
		className: "relative size-9 rounded-none",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
			to: "/notifications",
			"aria-label": `${t("shell.notifications")}${unread ? ` (${unread})` : ""}`,
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Bell, {
				className: "size-4",
				"aria-hidden": "true"
			}), unread > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				"aria-hidden": "true",
				className: "absolute right-1 top-1 flex min-w-4 items-center justify-center bg-foreground px-1 font-mono text-[9px] leading-4 text-background",
				children: unread > 9 ? "9+" : unread
			}) : null]
		})
	});
}
function AccountMenu({ identity, onSignOut }) {
	const t = useT();
	const { preference, setPreference } = useTheme();
	const { lang, setLang } = useI18n();
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DropdownMenu, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DropdownMenuTrigger, {
		asChild: true,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
			variant: "outline",
			size: "sm",
			className: "h-9 gap-2 rounded-none font-mono text-[11px]",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(preference === "dark" ? Moon : preference === "light" ? Sun : Monitor, {
					className: "size-3.5",
					"aria-hidden": "true"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "hidden max-w-[180px] truncate md:inline",
					children: identity
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "md:hidden",
					children: t("shell.account")
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronDown, {
					className: "size-3.5",
					"aria-hidden": "true"
				})
			]
		})
	}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DropdownMenuContent, {
		align: "end",
		className: "w-60 rounded-none",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DropdownMenuLabel, {
				className: "truncate font-mono text-[11px] font-normal text-muted-foreground",
				children: identity
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DropdownMenuSeparator, {}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DropdownMenuLabel, {
				className: "flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.18em]",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Sun, {
						className: "size-3",
						"aria-hidden": "true"
					}),
					" ",
					t("shell.theme")
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DropdownMenuRadioGroup, {
				value: preference,
				onValueChange: (v) => setPreference(v),
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DropdownMenuRadioItem, {
						value: "light",
						children: t("shell.theme.light")
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DropdownMenuRadioItem, {
						value: "dark",
						children: t("shell.theme.dark")
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DropdownMenuRadioItem, {
						value: "system",
						children: t("shell.theme.system")
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DropdownMenuSeparator, {}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DropdownMenuLabel, {
				className: "flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.18em]",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Languages, {
						className: "size-3",
						"aria-hidden": "true"
					}),
					" ",
					t("shell.language")
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DropdownMenuRadioGroup, {
				value: lang,
				onValueChange: (v) => setLang(v),
				children: LANGUAGES.map((l) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DropdownMenuRadioItem, {
					value: l.code,
					children: l.native
				}, l.code))
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DropdownMenuSeparator, {}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DropdownMenuItem, {
				onSelect: onSignOut,
				className: "gap-2",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(LogOut, {
						className: "size-4",
						"aria-hidden": "true"
					}),
					" ",
					t("shell.signOut")
				]
			})
		]
	})] });
}
function CommandMenu({ open, onOpenChange, groups, onSignOut }) {
	const t = useT();
	const navigate = useNavigate();
	const { setPreference } = useTheme();
	const go = (to) => {
		onOpenChange(false);
		navigate({ to });
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CommandDialog, {
		open,
		onOpenChange,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Command$1, {
			label: t("shell.search"),
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CommandInput, { placeholder: t("shell.search") }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CommandList, { children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CommandEmpty, { children: "—" }),
				groups.map((g) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CommandGroup, {
					heading: t(g.labelKey),
					children: g.items.map((item) => {
						const Icon = item.icon;
						return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CommandItem, {
							value: t(item.labelKey),
							onSelect: () => go(item.to),
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, {
								className: "mr-2 size-4",
								"aria-hidden": "true"
							}), t(item.labelKey)]
						}, item.to);
					})
				}, g.labelKey)),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CommandGroup, {
					heading: t("shell.account"),
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CommandItem, {
							value: t("shell.theme.light"),
							onSelect: () => {
								setPreference("light");
								onOpenChange(false);
							},
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Sun, {
									className: "mr-2 size-4",
									"aria-hidden": "true"
								}),
								" ",
								t("shell.theme"),
								":",
								" ",
								t("shell.theme.light")
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CommandItem, {
							value: t("shell.theme.dark"),
							onSelect: () => {
								setPreference("dark");
								onOpenChange(false);
							},
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Moon, {
									className: "mr-2 size-4",
									"aria-hidden": "true"
								}),
								" ",
								t("shell.theme"),
								":",
								" ",
								t("shell.theme.dark")
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CommandItem, {
							value: t("shell.signOut"),
							onSelect: () => {
								onOpenChange(false);
								onSignOut();
							},
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(LogOut, {
									className: "mr-2 size-4",
									"aria-hidden": "true"
								}),
								" ",
								t("shell.signOut")
							]
						})
					]
				})
			] })]
		})
	});
}
/** Announces route changes to assistive tech and moves focus to the new page's content. */
function RouteAnnouncer() {
	const pathname = useRouterState({ select: (s) => s.location.pathname });
	const [message, setMessage] = (0, import_react.useState)("");
	(0, import_react.useEffect)(() => {
		const id = window.setTimeout(() => {
			setMessage(document.title);
			document.getElementById("main")?.focus({ preventScroll: true });
		}, 100);
		return () => window.clearTimeout(id);
	}, [pathname]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		"aria-live": "polite",
		"aria-atomic": "true",
		role: "status",
		className: "sr-only",
		children: message
	});
}
function Splash({ children }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "flex min-h-screen items-center justify-center bg-background px-4",
		role: "status",
		"aria-live": "polite",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "max-w-md text-center font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground",
			children
		})
	});
}
/**
* Page frame + auth guard.
*  role="trader"   — phone/password session required
*  role="operator" — operator/arbiter session required
*  role="any"      — either (default); pages then branch on the session kind
* Unauthenticated visitors are sent to /login.
*/
function Shell({ children, role = "any" }) {
	const { session, logout } = useSession();
	const navigate = useNavigate();
	const t = useT();
	const [drawer, setDrawer] = (0, import_react.useState)(false);
	const [palette, setPalette] = (0, import_react.useState)(false);
	const signedIn = session.status === "trader" || session.status === "operator";
	const signOut = (0, import_react.useCallback)(() => {
		logout().then(() => navigate({ to: "/login" }));
	}, [logout, navigate]);
	const idle = useIdleTimeout({
		enabled: signedIn,
		idleMs: 84e4,
		graceMs: 6e4,
		onExpire: signOut
	});
	(0, import_react.useEffect)(() => {
		if (session.status === "anon") navigate({ to: "/login" });
	}, [session.status, navigate]);
	(0, import_react.useEffect)(() => {
		const onKey = (e) => {
			if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
				e.preventDefault();
				setPalette((o) => !o);
			}
		};
		window.addEventListener("keydown", onKey);
		return () => window.removeEventListener("keydown", onKey);
	}, []);
	if (session.status === "loading" || session.status === "anon") return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Splash, { children: [t("common.loading"), "…"] });
	const wrongRole = role === "trader" && session.status !== "trader" || role === "operator" && session.status !== "operator";
	const groups = session.status === "trader" ? traderNav : operatorNav;
	const identity = session.status === "trader" ? `${session.trader.full_name} · ${session.trader.phone_number}` : `${session.operator.email} · ${session.operator.role}`;
	const brand = /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
		to: "/",
		"aria-label": "VUKA — home",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(VukaLogo, { tagline: t("app.tagline") })
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "min-h-screen bg-background text-foreground",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
				href: "#main",
				className: "sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-[100] focus:bg-foreground focus:px-4 focus:py-2 focus:text-background",
				children: t("skip.content")
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(RouteAnnouncer, {}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "lg:grid lg:grid-cols-[256px_minmax(0,1fr)]",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("aside", {
					"data-app-chrome": true,
					"aria-label": "Primary",
					className: "sticky top-0 hidden h-screen flex-col border-r border-sidebar-border bg-sidebar lg:flex",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "border-b border-sidebar-border px-5 py-5",
							children: brand
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("nav", {
							"aria-label": "Main",
							className: "flex-1 overflow-y-auto px-2 py-5",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(NavList, { groups })
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "border-t border-sidebar-border px-5 py-4",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(EngineChip, {})
						})
					]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex min-h-screen min-w-0 flex-col",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
							"data-app-chrome": true,
							className: "sticky top-0 z-40 flex items-center gap-2 border-b border-border bg-background/95 px-4 py-2.5 backdrop-blur sm:px-6",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
									variant: "ghost",
									size: "icon",
									className: "size-9 rounded-none lg:hidden",
									onClick: () => setDrawer(true),
									"aria-label": t("shell.menu"),
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Menu, {
										className: "size-5",
										"aria-hidden": "true"
									})
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "lg:hidden",
									children: brand
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
									type: "button",
									onClick: () => setPalette(true),
									className: "ml-auto flex h-9 min-w-0 items-center gap-2 border border-border px-3 text-left text-xs text-muted-foreground transition-colors hover:bg-accent hover:text-foreground sm:w-64 sm:flex-none",
									"aria-label": t("shell.search"),
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Search, {
											className: "size-3.5 shrink-0",
											"aria-hidden": "true"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "hidden flex-1 truncate sm:inline",
											children: t("shell.search")
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("kbd", {
											className: "hidden border border-border px-1 font-mono text-[10px] sm:inline",
											children: "⌘K"
										})
									]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex items-center gap-1.5",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "hidden md:inline-flex lg:hidden",
											children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(EngineChip, {})
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "hidden sm:inline-flex",
											children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Chip, {
												tone: "invert",
												children: session.status === "trader" ? t("auth.trader") : t("auth.operator")
											})
										}),
										session.status === "trader" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TraderBell, {}) : null,
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(AccountMenu, {
											identity,
											onSignOut: signOut
										})
									]
								})
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("main", {
							id: "main",
							tabIndex: -1,
							className: "mx-auto w-full max-w-[1400px] flex-1 space-y-6 px-4 py-6 outline-none sm:px-6 sm:py-8",
							children: wrongRole ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								role: "alert",
								className: "border-2 border-foreground p-6",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "font-mono text-[10px] uppercase tracking-[0.2em]",
									children: "Wrong account type"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
									className: "mt-2 max-w-xl text-sm text-muted-foreground",
									children: [
										"This page is only available to ",
										role,
										" accounts. You are signed in as",
										" ",
										session.status,
										". Sign out and sign in with the right credentials to continue."
									]
								})]
							}) : children
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("footer", {
							"data-app-chrome": true,
							className: "border-t border-border px-4 py-5 sm:px-6",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground",
								children: "VUKA settlement network · sandbox providers · settlement execution disabled"
							})
						})
					]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Sheet, {
				open: drawer,
				onOpenChange: setDrawer,
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SheetContent, {
					side: "left",
					className: "w-72 rounded-none bg-sidebar p-0",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SheetTitle, {
							className: "sr-only",
							children: t("shell.menu")
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SheetDescription, {
							className: "sr-only",
							children: "Primary navigation"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "border-b border-sidebar-border px-5 py-5",
							children: brand
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("nav", {
							"aria-label": "Main",
							className: "overflow-y-auto px-2 py-5",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(NavList, {
								groups,
								onNavigate: () => setDrawer(false)
							})
						})
					]
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CommandMenu, {
				open: palette,
				onOpenChange: setPalette,
				groups,
				onSignOut: signOut
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Dialog, {
				open: idle.warning,
				onOpenChange: (o) => !o && idle.stay(),
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogContent, {
					className: "rounded-none sm:max-w-sm",
					role: "alertdialog",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogHeader, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogTitle, {
						className: "font-mono text-sm uppercase tracking-[0.18em]",
						children: t("shell.session.title")
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogDescription, { children: [
						t("shell.session.body"),
						" (",
						idle.secondsLeft,
						"s)"
					] })] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogFooter, {
						className: "gap-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							variant: "outline",
							className: "rounded-none font-mono text-xs uppercase",
							onClick: signOut,
							children: t("shell.signOut")
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							className: "rounded-none font-mono text-xs uppercase",
							onClick: idle.stay,
							children: t("shell.session.stay")
						})]
					})]
				})
			})
		]
	});
}
//#endregion
export { useWallet as _, DialogFooter as a, Metric as c, Shell as d, accountLabel as f, useTransfers as g, useNotifications as h, DialogDescription as i, PageHeader as l, useInvoices as m, Dialog as n, DialogHeader as o, directionFor as p, DialogContent as r, DialogTitle as s, Chip as t, Panel as u };
