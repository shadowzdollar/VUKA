import { i as __toESM } from "../_runtime.mjs";
import { l as isApiError, m as platform, o as describeError, r as auth } from "./endpoints-Dhw-Uhtx.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { y as require_jsx_runtime } from "../_libs/@radix-ui/react-accordion+[...].mjs";
import { d as cn, t as Button } from "./dropdown-menu-WnKjXFQ9.mjs";
import { i as useT } from "./i18n-CuQ20qdj.mjs";
import { b as Link, x as useNavigate } from "../_libs/@tanstack/react-router+[...].mjs";
import { n as useQuery } from "../_libs/tanstack__react-query.mjs";
import { t as Input } from "./input-Lx3Itb5F.mjs";
import { r as useSession } from "./session-DisxoMRQ.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { t as Label } from "./label-B471Uw28.mjs";
import { n as PasswordField, t as AuthFrame } from "./password-field-Dn3Pqjn1.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/login-BDCPt3p5.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function Login() {
	const t = useT();
	const { session, refresh } = useSession();
	const navigate = useNavigate();
	const [mode, setMode] = (0, import_react.useState)("trader");
	const [identifier, setIdentifier] = (0, import_react.useState)("");
	const [password, setPassword] = (0, import_react.useState)("");
	const [busy, setBusy] = (0, import_react.useState)(false);
	const [error, setError] = (0, import_react.useState)(null);
	const showDemo = useQuery({
		queryKey: ["public-config"],
		queryFn: platform.config,
		staleTime: 3e5,
		retry: false
	}).data?.environment === "development";
	(0, import_react.useEffect)(() => {
		if (session.status === "trader" || session.status === "operator") navigate({ to: "/" });
	}, [session.status, navigate]);
	async function submit(e) {
		e.preventDefault();
		setError(null);
		setBusy(true);
		try {
			if (mode === "trader") await auth.traderLogin(identifier.trim(), password);
			else await auth.operatorLogin(identifier.trim(), password);
			await refresh();
			toast.success("Signed in");
		} catch (err) {
			setError(isApiError(err) && err.code === "too_many_attempts" ? t("auth.tooMany") : isApiError(err) && err.code === "invalid_credentials" ? mode === "trader" ? "Invalid phone number or password." : "Invalid email or password." : describeError(err));
		} finally {
			setBusy(false);
		}
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AuthFrame, {
		variant: "login",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
				className: "text-3xl font-semibold tracking-tight",
				children: t("auth.welcome")
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-2 text-sm text-muted-foreground",
				children: t("auth.welcome.sub")
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				role: "tablist",
				"aria-label": "Account type",
				className: "mt-8 grid grid-cols-2 border border-border",
				children: ["trader", "operator"].map((m) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					role: "tab",
					"aria-selected": mode === m,
					onClick: () => {
						setMode(m);
						setIdentifier("");
						setError(null);
					},
					className: cn("px-4 py-2.5 font-mono text-[11px] uppercase tracking-[0.18em] transition-colors", mode === m ? "bg-foreground text-background" : "text-muted-foreground hover:bg-accent"),
					children: m === "trader" ? t("auth.trader") : t("auth.operator")
				}, m))
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
				onSubmit: submit,
				className: "mt-6 space-y-4",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "space-y-1.5",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
							htmlFor: "identifier",
							className: "font-mono text-[10px] uppercase tracking-[0.16em]",
							children: mode === "trader" ? t("auth.phone") : t("auth.email")
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
							id: "identifier",
							className: "rounded-none",
							autoComplete: mode === "trader" ? "tel" : "username",
							inputMode: mode === "trader" ? "tel" : "email",
							placeholder: mode === "trader" ? "+250700000000" : "operator@company.com",
							value: identifier,
							onChange: (e) => setIdentifier(e.target.value),
							required: true
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "space-y-1.5",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
							htmlFor: "password",
							className: "font-mono text-[10px] uppercase tracking-[0.16em]",
							children: t("auth.password")
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PasswordField, {
							id: "password",
							autoComplete: "current-password",
							value: password,
							onChange: (e) => setPassword(e.target.value),
							required: true
						})]
					}),
					error ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						role: "alert",
						className: "border-2 border-foreground p-3 text-xs",
						children: error
					}) : null,
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						type: "submit",
						disabled: busy || !identifier || !password,
						className: "w-full rounded-none font-mono text-xs uppercase",
						children: busy ? t("auth.signingIn") : t("auth.signIn")
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("details", {
				className: "mt-5 border border-border p-3 text-xs text-muted-foreground",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("summary", {
					className: "cursor-pointer font-mono uppercase tracking-[0.14em] text-foreground",
					children: "Forgot your password?"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "mt-2",
					children: [
						"Self-service reset is not yet available in this sandbox. Trader passwords are reset by the support team after identity confirmation; operator credentials are re-issued by the platform administrator. Use",
						" ",
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
							to: "/support",
							className: "underline underline-offset-4",
							children: "Help and support"
						}),
						"."
					]
				})]
			}),
			showDemo ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				"aria-label": "Development demo accounts",
				className: "mt-5 border border-dashed border-foreground p-3 text-xs",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "font-mono uppercase tracking-[0.16em]",
						children: "Development demo access"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-1 text-muted-foreground",
						children: "Seeded local accounts, shown only because this engine reports environment=development."
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "mt-2 flex flex-wrap gap-1.5",
						children: [
							[
								"Trader (RW)",
								"trader",
								"+250700000991",
								"vuka-demo-2026"
							],
							[
								"Trader (KE)",
								"trader",
								"+254700000882",
								"vuka-demo-2026"
							],
							[
								"Operator",
								"operator",
								"operator@vuka.local",
								"operator-local-2026"
							],
							[
								"Arbiter",
								"operator",
								"arbiter@vuka.local",
								"arbiter-local-2026"
							]
						].map(([label, m, id, pw]) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							className: "border border-border px-2 py-1 font-mono text-[10px] uppercase tracking-[0.1em] hover:bg-accent",
							onClick: () => {
								setMode(m);
								setIdentifier(id);
								setPassword(pw);
								setError(null);
							},
							children: label
						}, label))
					})
				]
			}) : null,
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("ul", {
				className: "mt-6 grid gap-2 border-t border-border pt-5 text-xs text-muted-foreground sm:grid-cols-3",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "Sessions end after a period of inactivity." }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "Repeated failed sign-ins are temporarily blocked." }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "VUKA staff will never ask for your password." })
				]
			}),
			mode === "trader" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "mt-6 text-sm text-muted-foreground",
				children: [
					t("auth.newHere"),
					" ",
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
						to: "/register",
						className: "font-medium text-foreground underline underline-offset-4",
						children: t("auth.createAccount")
					})
				]
			}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-6 text-xs text-muted-foreground",
				children: "Operator accounts are provisioned by the platform team and cannot be self-registered."
			})
		]
	});
}
//#endregion
export { Login as component };
