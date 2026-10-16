import { i as __toESM } from "../_runtime.mjs";
import { _ as workflows, a as corridors, d as newIdempotencyKey, l as isApiError, o as describeError, t as ApiError, u as ledger } from "./endpoints-Dhw-Uhtx.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { y as require_jsx_runtime } from "../_libs/@radix-ui/react-accordion+[...].mjs";
import { t as Button } from "./dropdown-menu-WnKjXFQ9.mjs";
import { x as useNavigate } from "../_libs/@tanstack/react-router+[...].mjs";
import { a as useQueryClient, n as useQuery, r as useQueries, t as useMutation } from "../_libs/tanstack__react-query.mjs";
import { t as Input } from "./input-Lx3Itb5F.mjs";
import { n as ErrorState, r as Loading } from "./query-state-38NEt_Mf.mjs";
import { i as useTrader } from "./session-DisxoMRQ.mjs";
import { _ as useWallet, a as DialogFooter, d as Shell, i as DialogDescription, l as PageHeader, m as useInvoices, n as Dialog, o as DialogHeader, r as DialogContent, s as DialogTitle, t as Chip, u as Panel } from "./shell-TFIi8X1Z.mjs";
import { i as money, l as truncMid, o as shortId, r as fromMinor, s as toMinor, u as when } from "./format-DmZ5-Nei.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { t as Label } from "./label-B471Uw28.mjs";
import { a as SelectValue, i as SelectTrigger, n as SelectContent, r as SelectItem, t as Select } from "./select-D0Mx5SvU.mjs";
import { r as invoiceTotal } from "./trader-invoices-Dj-BXIGs.mjs";
import { t as Route } from "./send-Bdf77dgo.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/send-xjF1xrf0.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
/** Happy-path order; FAILED / REQUIRES_REVIEW are off-path terminal-until-acted-on states. */
var PATH = [
	"QUOTED",
	"COLLECTION_PENDING",
	"COLLECTED",
	"LEDGER_POSTED",
	"PAYOUT_PENDING",
	"COMPLETED"
];
var LABEL = {
	CREATED: "Created",
	QUOTED: "Quote bound",
	COLLECTION_PENDING: "Collecting from payer wallet",
	COLLECTED: "Funds collected",
	LEDGER_POSTED: "Ledger posted",
	PAYOUT_PENDING: "Paying out to recipient",
	COMPLETED: "Completed",
	FAILED: "Failed",
	REQUIRES_REVIEW: "Requires review"
};
var isSettled = (s) => s === "COMPLETED" || s === "FAILED" || s === "REQUIRES_REVIEW";
function stateTone(s) {
	if (s === "COMPLETED") return "invert";
	if (s === "FAILED" || s === "REQUIRES_REVIEW") return "warn";
	return "live";
}
/**
* Live view of one quote-bound provider workflow. Polls while the workflow is in flight and offers
* the engine's only two legal recoveries: retry a failed collection, or retry a payout that needs review.
*/
function WorkflowTracker({ id, defaultPhone = "" }) {
	const qc = useQueryClient();
	const wf = useQuery({
		queryKey: ["workflow", id],
		queryFn: () => workflows.get(id),
		refetchInterval: (q) => isSettled(q.state.data?.state) ? false : 2e3
	});
	const events = useQuery({
		queryKey: [
			"workflow-events",
			id,
			wf.data?.state
		],
		queryFn: () => workflows.events(id),
		enabled: wf.isSuccess
	});
	const [phone, setPhone] = (0, import_react.useState)(defaultPhone);
	const retry = useMutation({
		mutationFn: () => workflows.retry(id, phone.trim()),
		onSuccess: (res) => {
			const err = "error" in res ? res.error : void 0;
			if (err) toast.warning("Retry did not complete", { description: err });
			else toast.success("Retry submitted");
		},
		onError: (e) => toast.error("Retry rejected", { description: describeError(e) }),
		onSettled: () => {
			qc.invalidateQueries({ queryKey: ["workflow", id] });
			qc.invalidateQueries({ queryKey: ["wallet"] });
			qc.invalidateQueries({ queryKey: ["transfers"] });
		}
	});
	if (wf.isPending) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Loading, { label: "Loading payment" });
	if (wf.isError) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ErrorState, {
		error: wf.error,
		onRetry: () => void wf.refetch()
	});
	const w = wf.data;
	const idx = PATH.indexOf(w.state);
	const canRetry = w.state === "FAILED" && w.failed_step === "COLLECTION" || w.state === "REQUIRES_REVIEW" && w.failed_step === "PAYOUT";
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "space-y-4",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex flex-wrap items-center justify-between gap-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "font-mono text-xs",
					children: w.id
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-0.5 text-xs text-muted-foreground",
					children: [
						money(w.amount, w.currency_from),
						" → ",
						w.currency_to,
						" · corridor ",
						w.corridor_id
					]
				})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Chip, {
					tone: stateTone(w.state),
					children: LABEL[w.state] ?? w.state
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ol", {
				className: "grid gap-1.5 sm:grid-cols-6",
				children: PATH.map((s, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", {
					className: "border px-2 py-1.5 font-mono text-[10px] uppercase tracking-[0.1em] " + (i <= idx ? "border-foreground bg-foreground text-background" : "border-border text-muted-foreground"),
					children: LABEL[s]
				}, s))
			}),
			w.state === "FAILED" || w.state === "REQUIRES_REVIEW" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "border-2 border-foreground p-3 text-xs",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "font-mono text-[10px] uppercase tracking-[0.2em]",
						children: [w.state === "FAILED" ? "Payment failed" : "Payout needs review", w.failed_step ? ` · ${w.failed_step.toLowerCase()} step` : ""]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-1 text-muted-foreground",
						children: w.failure_reason ?? "The provider did not confirm this step."
					}),
					w.state === "REQUIRES_REVIEW" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-1 text-muted-foreground",
						children: "Your funds were collected and posted to the ledger. The payout is not treated as successful until it is confirmed or retried."
					}) : null,
					canRetry ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-3 flex flex-wrap items-center gap-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
							value: phone,
							onChange: (e) => setPhone(e.target.value),
							placeholder: w.failed_step === "PAYOUT" ? "Recipient mobile number" : "Your mobile number",
							className: "h-8 w-56 rounded-none font-mono text-xs"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							size: "sm",
							className: "h-8 rounded-none font-mono text-[10px] uppercase",
							disabled: retry.isPending || !phone.trim(),
							onClick: () => retry.mutate(),
							children: retry.isPending ? "Retrying…" : `Retry ${w.failed_step?.toLowerCase()}`
						})]
					}) : null
				]
			}) : null,
			w.state === "COMPLETED" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("dl", {
				className: "grid gap-2 border border-border p-3 font-mono text-[11px] sm:grid-cols-2",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Row, {
						k: "Ledger transfer",
						v: shortId(w.ledger_transfer_id, 12)
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Row, {
						k: "Rate applied",
						v: String(w.rate)
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Row, {
						k: "Collected via",
						v: w.collection_provider
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Row, {
						k: "Paid out via",
						v: w.payout_provider
					})
				]
			}) : null,
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("details", {
				className: "border border-border",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("summary", {
					className: "cursor-pointer px-3 py-2 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground",
					children: [
						"Audit trail (",
						events.data?.length ?? "…",
						" transitions)"
					]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
					className: "divide-y divide-border/60 px-3",
					children: (events.data ?? []).map((e) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
						className: "flex flex-wrap items-center justify-between gap-2 py-2 font-mono text-[11px]",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [
							"#",
							e.sequence,
							" ",
							e.from_state || "—",
							" → ",
							e.to_state,
							e.step ? ` · ${e.step.toLowerCase()}` : ""
						] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "text-muted-foreground",
							children: when(e.created_at)
						})]
					}, e.id))
				})]
			})
		]
	});
}
function Row({ k, v }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex justify-between gap-3",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", {
			className: "text-muted-foreground",
			children: k
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", { children: v })]
	});
}
/**
* The engine exposes workflows by id only (no list endpoint), so the ids a trader has started are
* remembered in this browser to let them revisit a payment's status. Per-trader, capped, best-effort.
*/
var MAX = 20;
var key = (traderId) => `vuka.workflows.${traderId}`;
function readRecentWorkflows(traderId) {
	try {
		const raw = window.localStorage.getItem(key(traderId));
		const parsed = raw ? JSON.parse(raw) : [];
		return Array.isArray(parsed) ? parsed.filter((x) => typeof x === "string") : [];
	} catch {
		return [];
	}
}
function rememberWorkflow(traderId, id) {
	try {
		const next = [id, ...readRecentWorkflows(traderId).filter((x) => x !== id)].slice(0, MAX);
		window.localStorage.setItem(key(traderId), JSON.stringify(next));
	} catch {}
}
function useDebounced(value, ms = 400) {
	const [v, setV] = (0, import_react.useState)(value);
	(0, import_react.useEffect)(() => {
		const t = setTimeout(() => setV(value), ms);
		return () => clearTimeout(t);
	}, [value, ms]);
	return v;
}
/** A failed workflow start still returns the workflow (HTTP 202/422 with a string `error`). */
function workflowFromError(e) {
	if (!isApiError(e)) return void 0;
	const body = e.body;
	return body?.workflow?.id ? body.workflow : void 0;
}
function SendPayment() {
	const trader = useTrader();
	const qc = useQueryClient();
	const navigate = useNavigate();
	const { invoice: invoiceParam } = Route.useSearch();
	const wallet = useWallet();
	const corridors$1 = useQuery({
		queryKey: ["corridors"],
		queryFn: corridors.list
	});
	const received = useInvoices("received");
	const [sourceId, setSourceId] = (0, import_react.useState)("");
	const [phone, setPhone] = (0, import_react.useState)("");
	const [recipient, setRecipient] = (0, import_react.useState)(null);
	const [destId, setDestId] = (0, import_react.useState)("");
	const [amount, setAmount] = (0, import_react.useState)("");
	const [invoiceNumber, setInvoiceNumber] = (0, import_react.useState)("");
	const [payerPhone, setPayerPhone] = (0, import_react.useState)(trader.phone_number);
	const [authRef, setAuthRef] = (0, import_react.useState)("");
	const [needsAuth, setNeedsAuth] = (0, import_react.useState)(false);
	const [confirmOpen, setConfirmOpen] = (0, import_react.useState)(false);
	const [activeWf, setActiveWf] = (0, import_react.useState)(null);
	const [recent, setRecent] = (0, import_react.useState)([]);
	const keyRef = (0, import_react.useRef)(newIdempotencyKey());
	(0, import_react.useEffect)(() => setRecent(readRecentWorkflows(trader.id)), [trader.id, activeWf]);
	const businessAccounts = (0, import_react.useMemo)(() => (wallet.data?.accounts ?? []).filter((a) => a.type === "BUSINESS"), [wallet.data]);
	const source = businessAccounts.find((a) => a.id === sourceId) ?? businessAccounts[0];
	const destOptions = (recipient?.accounts ?? []).filter((a) => a.type === "BUSINESS");
	const dest = destOptions.find((a) => a.id === destId) ?? destOptions[0];
	const lookup = useMutation({
		mutationFn: () => ledger.recipient(phone.trim()),
		onSuccess: (r) => {
			setRecipient(r);
			setDestId("");
		},
		onError: (e) => {
			setRecipient(null);
			toast.error(isApiError(e) && e.status === 404 ? "No VUKA trader with that number" : describeError(e));
		}
	});
	const value = Number(amount);
	const amountValid = Number.isFinite(value) && value > 0;
	const balance = source ? wallet.data?.balances[source.id]?.amount ?? 0 : 0;
	const mode = !source || !dest ? null : source.currency === dest.currency ? "domestic" : "workflow";
	const corridor = (0, import_react.useMemo)(() => source && dest && source.currency !== dest.currency ? corridors$1.data?.find((c) => c.from_currency === source.currency && c.to_currency === dest.currency) : void 0, [
		corridors$1.data,
		source,
		dest
	]);
	const debouncedMinor = useDebounced(amountValid ? toMinor(value) : 0);
	const quote = useQuery({
		queryKey: [
			"quote",
			corridor?.id,
			debouncedMinor
		],
		queryFn: () => corridors.quote(corridor.id, debouncedMinor),
		enabled: !!corridor && debouncedMinor > 0,
		retry: false
	});
	const unpaidInvoices = (received.data ?? []).filter((i) => i.status !== "PAID");
	const appliedParam = (0, import_react.useRef)(false);
	(0, import_react.useEffect)(() => {
		if (appliedParam.current || !invoiceParam || !received.data) return;
		appliedParam.current = true;
		const inv = received.data.find((i) => i.number === invoiceParam && i.status !== "PAID");
		if (inv) {
			setInvoiceNumber(inv.number);
			setAmount(String(Math.round(invoiceTotal(inv) * 100) / 100));
		}
	}, [invoiceParam, received.data]);
	function pickInvoice(number) {
		setInvoiceNumber(number === "none" ? "" : number);
		const inv = unpaidInvoices.find((i) => i.number === number);
		if (inv) setAmount(String(Math.round(invoiceTotal(inv) * 100) / 100));
	}
	const overBalance = amountValid && value > balance;
	const corridorLimit = corridor && amountValid && (toMinor(value) < corridor.min_amount_minor || toMinor(value) > corridor.max_amount_minor);
	const problem = !source ? "You have no business wallet yet." : !dest ? "Look up a recipient to choose a destination wallet." : !amountValid ? "Enter an amount." : overBalance ? `Amount exceeds your available balance (${money(balance, source.currency)}).` : source.currency !== dest.currency && corridors$1.isSuccess && !corridor ? `No corridor is available for ${source.currency} → ${dest.currency}.` : corridorLimit ? "Amount is outside this corridor's limits." : mode !== "domestic" && !quote.data ? quote.isError ? describeError(quote.error) : "Waiting for a quote…" : null;
	const send = useMutation({
		mutationFn: async () => {
			const key = keyRef.current;
			if (mode === "domestic") {
				const input = {
					source_account_id: source.id,
					destination_account_id: dest.id,
					amount: value,
					currency: source.currency
				};
				if (invoiceNumber) input.invoice_number = invoiceNumber;
				await ledger.createTransfer(input, key);
				return null;
			}
			return await workflows.start({
				source_account_id: source.id,
				destination_account_id: dest.id,
				collection_phone: payerPhone.trim(),
				payout_phone: recipient.user.phone_number,
				corridor_id: corridor.id,
				quote_id: quote.data.quote.id,
				amount: value,
				currency_from: source.currency,
				currency_to: dest.currency,
				rate: quote.data.quote.rate,
				...invoiceNumber ? { invoice_number: invoiceNumber } : {},
				...authRef.trim() ? { provider_authorization_ref: authRef.trim() } : {}
			}, key);
		},
		onSuccess: (res) => {
			setConfirmOpen(false);
			setNeedsAuth(false);
			if (res?.workflow) {
				rememberWorkflow(trader.id, res.workflow.id);
				setActiveWf(res.workflow.id);
				if (res.error) toast.warning("Payment started but needs attention", { description: res.error });
			}
			toast.success(mode === "workflow" ? "Payment submitted" : "Transfer completed", { description: `${money(value, source.currency)} → ${recipient.user.full_name}` });
			keyRef.current = newIdempotencyKey();
			setAmount("");
			setInvoiceNumber("");
			setAuthRef("");
			qc.invalidateQueries({ queryKey: ["wallet"] });
			qc.invalidateQueries({ queryKey: ["transfers"] });
			qc.invalidateQueries({ queryKey: ["invoices"] });
		},
		onError: (e) => {
			setConfirmOpen(false);
			const wf = workflowFromError(e);
			if (wf) {
				rememberWorkflow(trader.id, wf.id);
				setActiveWf(wf.id);
				keyRef.current = newIdempotencyKey();
			}
			if (e instanceof ApiError && e.code === "provider_authorization_required") {
				setNeedsAuth(true);
				toast.warning("Provider authorization needed", { description: "Approve the prompt on your mobile money app, then enter the reference." });
				return;
			}
			if (e instanceof ApiError && e.code === "insufficient_funds") {
				const b = e.body;
				toast.error("Insufficient funds", { description: b?.available !== void 0 ? `Available ${money(b.available, b.currency)}, required ${money(b.required ?? 0, b.currency)}` : e.message });
				return;
			}
			if (e instanceof ApiError && e.code.startsWith("kyc_")) {
				toast.error("Verification limit reached", {
					description: e.message,
					action: {
						label: "Verify account",
						onClick: () => void navigate({ to: "/verification" })
					}
				});
				return;
			}
			toast.error("Payment not completed", { description: describeError(e) });
		}
	});
	const q = quote.data?.quote;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PageHeader, {
			eyebrow: "Settlement desk",
			title: "Send Payment",
			description: "Pay a supplier in another currency with a live corridor quote. Same-currency payments settle instantly on the ledger; cross-border payments run collect → post → payout with a tracked status."
		}),
		activeWf ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Panel, {
			title: "Payment status",
			meta: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Chip, {
				tone: "live",
				children: "Live"
			}),
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(WorkflowTracker, {
				id: activeWf,
				defaultPhone: payerPhone
			})
		}) : null,
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "grid gap-3 lg:grid-cols-[1fr_380px]",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Panel, {
				title: "Payment details",
				children: wallet.isPending ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Loading, {}) : wallet.isError ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ErrorState, {
					error: wallet.error,
					onRetry: () => void wallet.refetch()
				}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "space-y-4",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "space-y-1.5",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
									className: "font-mono text-[10px] uppercase tracking-[0.16em]",
									children: "Pay from"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Select, {
									value: source?.id ?? "",
									onValueChange: setSourceId,
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectTrigger, {
										"aria-label": "Pay from",
										className: "rounded-none font-mono text-xs",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectValue, { placeholder: "Business wallet" })
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectContent, {
										className: "rounded-none",
										children: businessAccounts.map((a) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SelectItem, {
											value: a.id,
											children: [
												"Business wallet ·",
												" ",
												money(wallet.data.balances[a.id]?.amount ?? 0, a.currency)
											]
										}, a.id))
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-[11px] text-muted-foreground",
									children: "Invoice payments can only be funded from a business wallet."
								})
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "space-y-1.5",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
									className: "font-mono text-[10px] uppercase tracking-[0.16em]",
									children: "Recipient mobile number"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex gap-2",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
										value: phone,
										onChange: (e) => {
											setPhone(e.target.value);
											setRecipient(null);
										},
										placeholder: "+254700000000",
										inputMode: "tel",
										className: "rounded-none font-mono"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
										variant: "outline",
										className: "rounded-none font-mono text-xs uppercase",
										disabled: !phone.trim() || lookup.isPending,
										onClick: () => lookup.mutate(),
										children: lookup.isPending ? "…" : "Look up"
									})]
								}),
								recipient ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex flex-wrap items-center justify-between gap-2 border border-border p-3",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "text-sm",
										children: recipient.user.full_name
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "font-mono text-[11px] text-muted-foreground",
										children: recipient.user.phone_number
									})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Chip, {
										tone: "invert",
										children: "Verified VUKA trader"
									})]
								}) : null
							]
						}),
						recipient && destOptions.length > 1 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "space-y-1.5",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
								className: "font-mono text-[10px] uppercase tracking-[0.16em]",
								children: "Recipient wallet"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Select, {
								value: dest?.id ?? "",
								onValueChange: setDestId,
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectTrigger, {
									"aria-label": "Recipient wallet",
									className: "rounded-none font-mono text-xs",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectValue, {})
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectContent, {
									className: "rounded-none",
									children: destOptions.map((a) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SelectItem, {
										value: a.id,
										children: ["Business wallet · ", a.currency]
									}, a.id))
								})]
							})]
						}) : null,
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "grid gap-4 sm:grid-cols-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "space-y-1.5",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Label, {
									className: "font-mono text-[10px] uppercase tracking-[0.16em]",
									children: ["Amount ", source ? `(${source.currency})` : ""]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
									value: amount,
									onChange: (e) => setAmount(e.target.value),
									inputMode: "decimal",
									placeholder: "0.00",
									className: "rounded-none font-mono"
								})]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "space-y-1.5",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
									className: "font-mono text-[10px] uppercase tracking-[0.16em]",
									children: "Pay an invoice (optional)"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Select, {
									value: invoiceNumber || "none",
									onValueChange: pickInvoice,
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectTrigger, {
										"aria-label": "Pay an invoice",
										className: "rounded-none font-mono text-xs",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectValue, {})
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SelectContent, {
										className: "rounded-none",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
											value: "none",
											children: "No invoice"
										}), unpaidInvoices.map((i) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SelectItem, {
											value: i.number,
											children: [
												i.number,
												" · ",
												money(invoiceTotal(i), i.currency)
											]
										}, i.id))]
									})]
								})]
							})]
						}),
						mode === "workflow" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "space-y-1.5",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
								className: "font-mono text-[10px] uppercase tracking-[0.16em]",
								children: "Your mobile money number (to be charged)"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
								value: payerPhone,
								onChange: (e) => setPayerPhone(e.target.value),
								inputMode: "tel",
								className: "rounded-none font-mono"
							})]
						}) : null,
						needsAuth ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "space-y-1.5 border-2 border-foreground p-3",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
									className: "font-mono text-[10px] uppercase tracking-[0.16em]",
									children: "Provider authorization reference"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
									value: authRef,
									onChange: (e) => setAuthRef(e.target.value),
									placeholder: "Reference from your MTN / M-Pesa prompt",
									className: "rounded-none font-mono"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-[11px] text-muted-foreground",
									children: "VUKA never collects or stores your mobile-money PIN. Complete the challenge with your provider, then paste the reference it gives you."
								})
							]
						}) : null,
						problem && amount ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							role: "status",
							className: "text-xs text-muted-foreground",
							children: problem
						}) : null,
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							className: "w-full rounded-none font-mono text-xs uppercase",
							disabled: !!problem || send.isPending || mode === "workflow" && !payerPhone.trim() || needsAuth && !authRef.trim(),
							onClick: () => setConfirmOpen(true),
							children: "Review payment"
						})
					]
				})
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "space-y-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Panel, {
					title: "Quote",
					meta: corridor ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Chip, { children: corridor.id }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Chip, { children: "Same currency" }),
					children: !corridor ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-xs text-muted-foreground",
						children: source && dest ? "Both wallets use the same currency, so no FX conversion or corridor fee applies." : "Choose a recipient to see pricing."
					}) : quote.isFetching && !q ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Loading, { label: "Fetching quote" }) : quote.isError ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ErrorState, {
						error: quote.error,
						onRetry: () => void quote.refetch()
					}) : q ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("dl", {
						className: "space-y-2 font-mono text-xs",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Line, {
								k: "You send",
								v: money(fromMinor(q.source_amount_minor), q.from_currency)
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Line, {
								k: `Fee (${corridor.fees_bps / 100}%)`,
								v: `−${money(fromMinor(q.fee_minor), q.from_currency)}`
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Line, {
								k: "Rate",
								v: `1 ${q.from_currency} = ${q.inverse_rate.toPrecision(5)} ${q.to_currency}`
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex justify-between border-t border-border pt-2 text-sm",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", { children: "Recipient receives" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", {
									className: "tabular-nums",
									children: money(fromMinor(q.deliver_amount_minor), q.to_currency)
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								className: "pt-1 text-[11px] text-muted-foreground",
								children: [
									"Quote ",
									truncMid(q.id, 10, 8),
									" · valid until",
									" ",
									new Date(q.expires_at).toLocaleString(),
									quote.data?.execution === "local_synthetic" ? " · sandbox execution" : ""
								]
							})
						]
					}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-xs text-muted-foreground",
						children: "Enter an amount to see a live quote."
					})
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(RecentPayments, {
					ids: recent,
					onOpen: setActiveWf
				})]
			})]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Dialog, {
			open: confirmOpen,
			onOpenChange: setConfirmOpen,
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogContent, {
				className: "rounded-none sm:max-w-md",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogHeader, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogTitle, {
						className: "font-mono text-sm uppercase tracking-[0.18em]",
						children: "Confirm payment"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogDescription, { children: "Payments are final once the ledger posts them." })] }),
					source && dest && recipient ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("dl", {
						className: "space-y-2 border border-border p-3 font-mono text-xs",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Line, {
								k: "To",
								v: recipient.user.full_name
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Line, {
								k: "Amount",
								v: money(value, source.currency)
							}),
							q ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Line, {
								k: "Recipient receives",
								v: money(fromMinor(q.deliver_amount_minor), q.to_currency)
							}) : null,
							invoiceNumber ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Line, {
								k: "Invoice",
								v: invoiceNumber
							}) : null,
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Line, {
								k: "Method",
								v: mode === "workflow" ? "Mobile-money collect + payout" : "Ledger transfer"
							})
						]
					}) : null,
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogFooter, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						className: "rounded-none font-mono text-xs uppercase",
						disabled: send.isPending,
						onClick: () => send.mutate(),
						children: send.isPending ? "Processing…" : "Confirm and send"
					}) })
				]
			})
		})
	] });
}
function Line({ k, v }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex justify-between gap-3",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", {
			className: "text-muted-foreground",
			children: k
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", {
			className: "tabular-nums",
			children: v
		})]
	});
}
function RecentPayments({ ids, onOpen }) {
	const results = useQueries({ queries: ids.slice(0, 6).map((id) => ({
		queryKey: ["workflow", id],
		queryFn: () => workflows.get(id)
	})) });
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Panel, {
		title: "Recent cross-border payments",
		children: ids.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "text-xs text-muted-foreground",
			children: "Payments you start from this browser appear here."
		}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
			className: "divide-y divide-border/60",
			children: ids.slice(0, 6).map((id, i) => {
				const w = results[i]?.data;
				return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
					type: "button",
					onClick: () => onOpen(id),
					className: "flex w-full items-center justify-between gap-3 py-2.5 text-left hover:bg-accent/40",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "block font-mono text-xs",
						children: shortId(id, 12)
					}), w ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
						className: "text-[11px] text-muted-foreground",
						children: [
							money(w.amount, w.currency_from),
							" → ",
							w.currency_to
						]
					}) : null] }), w ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Chip, {
						tone: stateTone(w.state),
						children: w.state.replace("_", " ")
					}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Chip, { children: "…" })]
				}) }, id);
			})
		})
	});
}
var SplitComponent = () => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Shell, {
	role: "trader",
	children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SendPayment, {})
});
//#endregion
export { SplitComponent as component };
