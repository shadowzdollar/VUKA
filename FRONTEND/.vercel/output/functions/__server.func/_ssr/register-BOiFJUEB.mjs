import { i as __toESM } from "../_runtime.mjs";
import { l as isApiError, m as platform, o as describeError, r as auth } from "./endpoints-Dhw-Uhtx.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { y as require_jsx_runtime } from "../_libs/@radix-ui/react-accordion+[...].mjs";
import { Q as Check, at as ArrowRight, i as User, ot as ArrowLeft, tt as Briefcase } from "../_libs/lucide-react.mjs";
import { d as cn, t as Button } from "./dropdown-menu-WnKjXFQ9.mjs";
import { t as Flag } from "./flags-fYmYFIMT.mjs";
import { b as Link, x as useNavigate } from "../_libs/@tanstack/react-router+[...].mjs";
import { n as useQuery } from "../_libs/tanstack__react-query.mjs";
import { t as Input } from "./input-Lx3Itb5F.mjs";
import { r as useSession } from "./session-DisxoMRQ.mjs";
import { i as money } from "./format-DmZ5-Nei.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { n as DIAL } from "./markets-CXFrz9pK.mjs";
import { t as Label } from "./label-B471Uw28.mjs";
import { i as passwordStrength, n as PasswordField, r as StrengthMeter, t as AuthFrame } from "./password-field-Dn3Pqjn1.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/register-BOiFJUEB.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var PHONE = /^\+[1-9]\d{7,14}$/;
var STEPS = [
	"Account type",
	"Your details",
	"Security",
	"Review"
];
function Register() {
	const { refresh } = useSession();
	const navigate = useNavigate();
	const config = useQuery({
		queryKey: ["public-config"],
		queryFn: platform.config,
		staleTime: 3e5,
		retry: false
	});
	const countries = (0, import_react.useMemo)(() => config.data?.countries ?? [], [config.data]);
	const [step, setStep] = (0, import_react.useState)(0);
	const [done, setDone] = (0, import_react.useState)(false);
	const [kind, setKind] = (0, import_react.useState)("business");
	const [country, setCountry] = (0, import_react.useState)("RW");
	const [currency, setCurrency] = (0, import_react.useState)("RWF");
	const [f, setF] = (0, import_react.useState)({
		name: "",
		local: "",
		reg: "",
		password: "",
		confirm: ""
	});
	const [agree, setAgree] = (0, import_react.useState)(false);
	const [busy, setBusy] = (0, import_react.useState)(false);
	const [error, setError] = (0, import_react.useState)(null);
	const heading = (0, import_react.useRef)(null);
	const dial = DIAL[country] ?? "";
	const phone = (0, import_react.useMemo)(() => {
		const digits = f.local.replace(/[^\d]/g, "");
		if (f.local.trim().startsWith("+")) return `+${digits}`;
		return digits ? `+${dial}${digits.replace(/^0+/, "")}` : "";
	}, [f.local, dial]);
	(0, import_react.useEffect)(() => {
		heading.current?.focus();
	}, [step, done]);
	function pickCountry(code) {
		setCountry(code);
		const c = countries.find((x) => x.code === code);
		if (c) setCurrency(c.currency);
	}
	const problems = [
		null,
		f.name.trim().length < 2 ? kind === "business" ? "Enter your business name." : "Enter your full name." : !PHONE.test(phone) ? "Enter a valid mobile number. Use the local number, or a full +country-code number." : null,
		f.password.length < 8 ? "Password must be at least 8 characters." : f.password !== f.confirm ? "Passwords do not match." : passwordStrength(f.password).score < 2 ? "Choose a stronger password." : !agree ? "Please accept the terms and privacy notice to continue." : null,
		null
	];
	function next() {
		const p = problems[step] ?? null;
		setError(p);
		if (!p) setStep((s) => Math.min(STEPS.length - 1, s + 1));
	}
	async function submit(e) {
		e.preventDefault();
		if (step < STEPS.length - 1) return next();
		for (const p of problems) if (p) {
			setError(p);
			return;
		}
		setError(null);
		setBusy(true);
		try {
			const input = {
				full_name: f.name.trim(),
				phone_number: phone,
				password: f.password
			};
			if (kind === "business" && f.reg.trim()) input.business_reg_number = f.reg.trim();
			await auth.register(input, currency);
			await auth.traderLogin(phone, f.password);
			await refresh();
			toast.success("Account created");
			setDone(true);
		} catch (err) {
			setError(isApiError(err) && err.status === 409 ? "That mobile number is already registered. Try signing in instead." : describeError(err));
		} finally {
			setBusy(false);
		}
	}
	if (done) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Welcome, {
		name: f.name,
		currency,
		onContinue: () => void navigate({ to: "/" }),
		limits: config.data?.kyc_limits?.["PENDING"]
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AuthFrame, {
		variant: "register",
		wide: true,
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
				ref: heading,
				tabIndex: -1,
				className: "font-display text-4xl font-normal tracking-tight outline-none",
				children: "Create your trader account"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-2 text-sm text-muted-foreground",
				children: "A business wallet for trade and a separate personal wallet, so business income never mixes with household spending."
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ol", {
				"aria-label": "Progress",
				className: "mt-8 grid grid-cols-4 gap-1.5",
				children: STEPS.map((s, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
					"aria-current": i === step ? "step" : void 0,
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: cn("h-1 border border-foreground", i <= step && "bg-foreground") }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: cn("mt-1.5 flex items-center gap-1 font-mono text-[10px] uppercase tracking-[0.12em]", i === step ? "text-foreground" : "text-muted-foreground"),
						children: [
							i < step ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Check, {
								className: "size-3",
								"aria-hidden": "true"
							}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: i + 1 }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "hidden sm:inline",
								children: s
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "sr-only sm:hidden",
								children: s
							})
						]
					})]
				}, s))
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
				onSubmit: submit,
				noValidate: true,
				className: "mt-8 space-y-5",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "sr-only",
						children: STEPS[step]
					}),
					step === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("fieldset", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("legend", {
						className: "mb-3 text-sm font-medium",
						children: "How will you use VUKA?"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "grid gap-3 sm:grid-cols-2",
						role: "radiogroup",
						"aria-label": "Account type",
						children: [[
							"business",
							Briefcase,
							"Registered business",
							"Trade with suppliers and buyers, raise invoices, use escrow. You can add a registration number now or later."
						], [
							"individual",
							User,
							"Individual trader",
							"Sole trader or informal business. You can upgrade to business verification whenever you are ready."
						]].map(([k, Icon, h, b]) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							type: "button",
							role: "radio",
							"aria-checked": kind === k,
							onClick: () => setKind(k),
							className: cn("border p-4 text-left transition-colors", kind === k ? "border-foreground bg-foreground text-background" : "border-border hover:bg-accent"),
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, {
									className: "size-5",
									"aria-hidden": "true"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "mt-3 font-display text-xl",
									children: h
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: cn("mt-1 text-xs", kind === k ? "opacity-80" : "text-muted-foreground"),
									children: b
								})
							]
						}, k))
					})] }) : null,
					step === 1 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "space-y-4",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
								label: kind === "business" ? "Business name" : "Full name",
								id: "name",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
									id: "name",
									autoComplete: kind === "business" ? "organization" : "name",
									className: "rounded-none",
									value: f.name,
									onChange: (e) => setF({
										...f,
										name: e.target.value
									}),
									required: true
								})
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "grid gap-4 sm:grid-cols-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
									label: "Country",
									id: "country",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("select", {
										id: "country",
										value: country,
										onChange: (e) => pickCountry(e.target.value),
										className: "h-9 w-full border border-input bg-background px-2 text-sm",
										children: (countries.length ? countries : [{
											code: "RW",
											name: "Rwanda",
											currency: "RWF"
										}]).map((c) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
											value: c.code,
											children: c.name
										}, c.code))
									})
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
									label: "Home currency",
									id: "currency",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("select", {
										id: "currency",
										value: currency,
										onChange: (e) => setCurrency(e.target.value),
										className: "h-9 w-full border border-input bg-background px-2 font-mono text-sm",
										children: (config.data?.currencies ?? [currency]).map((c) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
											value: c,
											children: c
										}, c))
									})
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
								label: "Mobile number",
								id: "phone",
								hint: phone ? `Will be saved as ${phone}` : `Local number or full international form, e.g. +${dial || "250"}700000000`,
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
										className: "flex items-center border border-r-0 border-input bg-muted px-3 font-mono text-sm",
										"aria-hidden": "true",
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Flag, {
												code: country,
												className: "mr-2 w-5 shrink-0"
											}),
											"+",
											dial
										]
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
										id: "phone",
										inputMode: "tel",
										autoComplete: "tel-national",
										className: "rounded-none font-mono",
										placeholder: "700 000 000",
										value: f.local,
										onChange: (e) => setF({
											...f,
											local: e.target.value
										}),
										required: true
									})]
								})
							}),
							kind === "business" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
								label: "Business registration number (optional)",
								id: "reg",
								hint: "Helps with business verification later. You can leave it blank.",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
									id: "reg",
									className: "rounded-none font-mono",
									value: f.reg,
									onChange: (e) => setF({
										...f,
										reg: e.target.value
									})
								})
							}) : null
						]
					}) : null,
					step === 2 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "space-y-4",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
								label: "Password",
								id: "password",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PasswordField, {
									id: "password",
									autoComplete: "new-password",
									value: f.password,
									onChange: (e) => setF({
										...f,
										password: e.target.value
									}),
									required: true,
									"aria-describedby": "strength"
								})
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								id: "strength",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(StrengthMeter, { password: f.password })
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
								label: "Confirm password",
								id: "confirm",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PasswordField, {
									id: "confirm",
									warnCaps: false,
									autoComplete: "new-password",
									value: f.confirm,
									onChange: (e) => setF({
										...f,
										confirm: e.target.value
									}),
									required: true
								})
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
								className: "flex items-start gap-3 text-sm",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
									type: "checkbox",
									checked: agree,
									onChange: (e) => setAgree(e.target.checked),
									className: "mt-1 size-4 accent-[var(--color-foreground)]"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [
									"I have read the",
									" ",
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
										to: "/terms",
										target: "_blank",
										className: "underline underline-offset-4",
										children: "terms of use"
									}),
									" ",
									"and",
									" ",
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
										to: "/privacy",
										target: "_blank",
										className: "underline underline-offset-4",
										children: "privacy notice"
									}),
									", and understand this is a sandbox where no real money moves."
								] })]
							})
						]
					}) : null,
					step === 3 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dl", {
						className: "divide-y divide-border border border-border text-sm",
						children: [
							["Account type", kind === "business" ? "Registered business" : "Individual trader"],
							[kind === "business" ? "Business name" : "Name", f.name.trim()],
							["Country", countries.find((c) => c.code === country)?.name ?? country],
							["Home currency", currency],
							["Mobile number", phone],
							...kind === "business" && f.reg.trim() ? [["Registration no.", f.reg.trim()]] : []
						].map(([k, v]) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex justify-between gap-4 p-3",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", {
								className: "text-muted-foreground",
								children: k
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", {
								className: "text-right font-mono text-xs",
								children: v
							})]
						}, k))
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-3 text-xs text-muted-foreground",
						children: "Your password is sent over an encrypted connection and stored only as a salted hash. You can go back to change anything."
					})] }) : null,
					error ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						role: "alert",
						className: "border-2 border-foreground p-3 text-xs",
						children: error
					}) : null,
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center justify-between gap-3",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
							type: "button",
							variant: "ghost",
							disabled: step === 0 || busy,
							onClick: () => {
								setError(null);
								setStep((s) => s - 1);
							},
							className: "rounded-none font-mono text-xs uppercase",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowLeft, {
								className: "mr-2 size-4",
								"aria-hidden": "true"
							}), "Back"]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							type: "submit",
							disabled: busy,
							className: "rounded-none font-mono text-xs uppercase",
							children: step < STEPS.length - 1 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: ["Continue", /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowRight, {
								className: "ml-2 size-4",
								"aria-hidden": "true"
							})] }) : busy ? "Creating account…" : "Create account"
						})]
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "mt-8 text-sm text-muted-foreground",
				children: [
					"Already registered?",
					" ",
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
						to: "/login",
						className: "font-medium text-foreground underline underline-offset-4",
						children: "Sign in"
					})
				]
			})
		]
	});
}
function Welcome({ name, currency, limits, onContinue }) {
	const h = (0, import_react.useRef)(null);
	(0, import_react.useEffect)(() => h.current?.focus(), []);
	const next = [
		[
			"Explore your wallets",
			"A business wallet and a personal wallet were created in " + currency + ".",
			"/wallets"
		],
		[
			"Get verified",
			"File a verification reference to raise your limits.",
			"/verification"
		],
		[
			"Send your first payment",
			"Quote a corridor, then pay; the price is shown first.",
			"/send"
		]
	];
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AuthFrame, {
		variant: "register",
		wide: true,
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "stamp-in inline-block border-2 border-foreground px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.2em]",
				children: "Account opened"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h1", {
				ref: h,
				tabIndex: -1,
				className: "mt-4 font-display text-4xl font-normal tracking-tight outline-none",
				children: [
					"Welcome, ",
					name.trim().split(" ")[0],
					"."
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-2 text-sm text-muted-foreground",
				children: "Your account is ready. It starts unverified, with conservative limits until compliance reviews your reference."
			}),
			limits ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dl", {
				className: "mt-6 grid grid-cols-3 border border-border text-center",
				children: [
					["Per payment", limits.per_txn_usd],
					["Per day", limits.daily_usd],
					["Per month", limits.monthly_usd]
				].map(([k, v]) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "border-r border-border p-3 last:border-r-0",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", {
						className: "tabular font-display text-2xl",
						children: money(v, "USD")
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", {
						className: "font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground",
						children: k
					})]
				}, k))
			}) : null,
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ol", {
				className: "mt-6 space-y-2",
				children: next.map(([h2, b, to], i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
					to,
					className: "flex items-start gap-4 border border-border p-4 hover:bg-accent",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "font-mono text-xs text-muted-foreground",
						children: String(i + 1).padStart(2, "0")
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "block font-display text-xl",
						children: h2
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "text-xs text-muted-foreground",
						children: b
					})] })]
				}) }, to))
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
				onClick: onContinue,
				className: "mt-6 rounded-none font-mono text-xs uppercase",
				children: ["Go to my dashboard", /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowRight, {
					className: "ml-2 size-4",
					"aria-hidden": "true"
				})]
			})
		]
	});
}
function Field({ label, id, hint, children }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "space-y-1.5",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
				htmlFor: id,
				className: "font-mono text-[10px] uppercase tracking-[0.16em]",
				children: label
			}),
			children,
			hint ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-xs text-muted-foreground",
				children: hint
			}) : null
		]
	});
}
//#endregion
export { Register as component };
