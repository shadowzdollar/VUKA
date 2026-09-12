import { Link } from "react-router-dom";
import { Button } from "../components";

export function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Link to="/" className="flex items-center space-x-2">
                  <div className="w-10 h-10 bg-black rounded-lg flex items-center justify-center">
                    <span className="text-white font-bold text-xl">V</span>
                  </div>
                  <div>
                    <span className="text-xl font-bold text-black">VUKA</span>
                    <span className="block text-xs text-gray-500 tracking-wider">TRADE TRUST</span>
                  </div>
                </Link>
              </div>
            </div>
            
            <div className="hidden md:block">
              <div className="ml-10 flex items-baseline space-x-8">
                <a href="#platform" className="text-gray-700 hover:text-black px-3 py-2 text-sm font-medium transition-colors">Platform</a>
                <a href="#solutions" className="text-gray-700 hover:text-black px-3 py-2 text-sm font-medium transition-colors">Solutions</a>
                <a href="#network" className="text-gray-700 hover:text-black px-3 py-2 text-sm font-medium transition-colors">Network</a>
                <a href="#about" className="text-gray-700 hover:text-black px-3 py-2 text-sm font-medium transition-colors">About</a>
                <a href="#contact" className="text-gray-700 hover:text-black px-3 py-2 text-sm font-medium transition-colors">Contact</a>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <Link to="/trader" className="text-sm font-medium text-gray-700 hover:text-black transition-colors">
                Sign in
              </Link>
              <Link to="/trader">
                <Button variant="primary" size="sm">
                  Open Account
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center px-3 py-1 rounded-full bg-black text-white text-xs font-medium mb-6">
                <span className="w-2 h-2 bg-white rounded-full mr-2 animate-pulse"></span>
                Now serving Rwanda ↔ Kenya corridor
              </div>
              
              <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-black leading-tight mb-6">
                Trade with trust.
                <br />
                <span className="text-gray-500">Settle with certainty.</span>
              </h1>
              
              <p className="text-xl text-gray-600 mb-8 max-w-lg">
                The trade-trust settlement platform for African SME traders. 
                Escrow-powered payments built on mobile money rails.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <Link to="/trader">
                  <Button variant="primary" size="lg" className="w-full sm:w-auto">
                    Start Trading
                  </Button>
                </Link>
                <a href="#platform">
                  <Button variant="outline" size="lg" className="w-full sm:w-auto">
                    Learn More
                  </Button>
                </a>
              </div>
              
              <div className="mt-12 grid grid-cols-3 gap-8">
                <div>
                  <div className="text-3xl font-bold text-black">$2.4M+</div>
                  <div className="text-sm text-gray-500">Protected in escrow</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-black">1,200+</div>
                  <div className="text-sm text-gray-500">Active traders</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-black">99.8%</div>
                  <div className="text-sm text-gray-500">Settlement success</div>
                </div>
              </div>
            </div>
            
            <div className="relative">
              <div className="bg-black rounded-2xl p-8 text-white">
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <div className="text-sm text-gray-400">Escrow Status</div>
                    <div className="text-2xl font-bold">LOCKED</div>
                  </div>
                  <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="flex justify-between items-center py-3 border-b border-gray-800">
                    <span className="text-gray-400">Invoice</span>
                    <span className="font-mono">INV-2026-0847</span>
                  </div>
                  <div className="flex justify-between items-center py-3 border-b border-gray-800">
                    <span className="text-gray-400">Amount</span>
                    <span className="font-bold">$12,500.00</span>
                  </div>
                  <div className="flex justify-between items-center py-3 border-b border-gray-800">
                    <span className="text-gray-400">Buyer</span>
                    <span>Kigali Electronics Ltd</span>
                  </div>
                  <div className="flex justify-between items-center py-3">
                    <span className="text-gray-400">Supplier</span>
                    <span>Nairobi Parts Co</span>
                  </div>
                </div>
                
                <div className="mt-6 p-4 bg-gray-900 rounded-lg">
                  <div className="flex items-center text-sm text-gray-400">
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    Funds secured on Polygon blockchain
                  </div>
                </div>
              </div>
              
              {/* Decorative elements */}
              <div className="absolute -top-4 -right-4 w-24 h-24 bg-gray-200 rounded-full opacity-50"></div>
              <div className="absolute -bottom-4 -left-4 w-16 h-16 bg-gray-200 rounded-full opacity-50"></div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="platform" className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-black mb-4">
              One platform for the entire trade lifecycle
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              From invoice to settlement, VUKA provides the trust layer that African cross-border trade has been missing.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="p-6 border border-gray-200 rounded-lg hover:border-black transition-colors">
              <div className="w-12 h-12 bg-black rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-black mb-2">Invoice-Linked Escrow</h3>
              <p className="text-gray-600 text-sm">
                Lock payments against specific invoices with timestamped, tamper-proof records.
              </p>
            </div>
            
            <div className="p-6 border border-gray-200 rounded-lg hover:border-black transition-colors">
              <div className="w-12 h-12 bg-black rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-black mb-2">Structural Trust</h3>
              <p className="text-gray-600 text-sm">
                Trust enforced by blockchain escrow, not just displayed as a history log.
              </p>
            </div>
            
            <div className="p-6 border border-gray-200 rounded-lg hover:border-black transition-colors">
              <div className="w-12 h-12 bg-black rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-black mb-2">Trust Scoring</h3>
              <p className="text-gray-600 text-sm">
                Algorithmic credit scores computed from real settlement behavior, not self-reported claims.
              </p>
            </div>
            
            <div className="p-6 border border-gray-200 rounded-lg hover:border-black transition-colors">
              <div className="w-12 h-12 bg-black rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-black mb-2">Mobile Money Rails</h3>
              <p className="text-gray-600 text-sm">
                Built on MTN MoMo, M-Pesa, and existing mobile money infrastructure.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="solutions" className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-black mb-4">
              How VUKA works
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              A simple, secure process that protects both buyers and suppliers.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-black rounded-full flex items-center justify-center mx-auto mb-4 text-white text-2xl font-bold">
                1
              </div>
              <h3 className="text-lg font-bold text-black mb-2">Create Invoice</h3>
              <p className="text-gray-600 text-sm">
                Supplier issues invoice with clear terms and payment conditions.
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-black rounded-full flex items-center justify-center mx-auto mb-4 text-white text-2xl font-bold">
                2
              </div>
              <h3 className="text-lg font-bold text-black mb-2">Lock Escrow</h3>
              <p className="text-gray-600 text-sm">
                Buyer deposits funds into smart contract escrow, not directly to supplier.
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-black rounded-full flex items-center justify-center mx-auto mb-4 text-white text-2xl font-bold">
                3
              </div>
              <h3 className="text-lg font-bold text-black mb-2">Ship Goods</h3>
              <p className="text-gray-600 text-sm">
                Supplier ships goods with proof of delivery and tracking information.
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-black rounded-full flex items-center justify-center mx-auto mb-4 text-white text-2xl font-bold">
                4
              </div>
              <h3 className="text-lg font-bold text-black mb-2">Confirm & Release</h3>
              <p className="text-gray-600 text-sm">
                Buyer confirms receipt, or auto-release triggers after agreed timeout.
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-black rounded-full flex items-center justify-center mx-auto mb-4 text-white text-2xl font-bold">
                5
              </div>
              <h3 className="text-lg font-bold text-black mb-2">Settlement</h3>
              <p className="text-gray-600 text-sm">
                Funds released to supplier via mobile money, trust score updated.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Network Section */}
      <section id="network" className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-black mb-4">
              Growing across Africa
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Starting with Rwanda ↔ Kenya, expanding corridor by corridor.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-8 bg-black text-white rounded-lg">
              <div className="text-3xl font-bold mb-2">Rwanda</div>
              <div className="text-gray-400 mb-4">RWF · MTN MoMo</div>
              <div className="text-sm text-gray-300">
                Kigali hub serving East African cross-border trade
              </div>
            </div>
            
            <div className="p-8 bg-gray-100 rounded-lg">
              <div className="text-3xl font-bold text-black mb-2">Kenya</div>
              <div className="text-gray-500 mb-4">KES · M-Pesa</div>
              <div className="text-sm text-gray-600">
                Nairobi gateway to regional commerce
              </div>
            </div>
            
            <div className="p-8 border-2 border-dashed border-gray-300 rounded-lg">
              <div className="text-3xl font-bold text-gray-400 mb-2">Coming Soon</div>
              <div className="text-gray-400 mb-4">Uganda · Tanzania · More</div>
              <div className="text-sm text-gray-500">
                Expanding responsibly with local partnerships
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-black text-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold mb-4">
            Ready to trade with certainty?
          </h2>
          <p className="text-xl text-gray-400 mb-8">
            Join thousands of African traders who trust VUKA for their cross-border payments.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/trader">
              <Button variant="primary" size="lg" className="bg-white text-black hover:bg-gray-100">
                Open Your Account
              </Button>
            </Link>
            <a href="#contact">
              <Button variant="outline" size="lg" className="border-white text-white hover:bg-white hover:text-black">
                Contact Sales
              </Button>
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer id="contact" className="bg-gray-50 border-t border-gray-200 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold">V</span>
                </div>
                <div>
                  <span className="font-bold text-black">VUKA</span>
                  <span className="block text-xs text-gray-500">TRADE TRUST</span>
                </div>
              </div>
              <p className="text-sm text-gray-600">
                Building the trust layer for African trade.
              </p>
            </div>
            
            <div>
              <h4 className="font-bold text-black mb-4">Platform</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li><a href="#platform" className="hover:text-black">Features</a></li>
                <li><a href="#solutions" className="hover:text-black">How it works</a></li>
                <li><a href="#network" className="hover:text-black">Network</a></li>
                <li><a href="#" className="hover:text-black">Pricing</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-bold text-black mb-4">Company</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li><a href="#about" className="hover:text-black">About</a></li>
                <li><a href="#" className="hover:text-black">Careers</a></li>
                <li><a href="#" className="hover:text-black">Press</a></li>
                <li><a href="#contact" className="hover:text-black">Contact</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-bold text-black mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li><a href="#" className="hover:text-black">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-black">Terms of Service</a></li>
                <li><a href="#" className="hover:text-black">Security</a></li>
                <li><a href="#" className="hover:text-black">Compliance</a></li>
              </ul>
            </div>
          </div>
          
          <div className="mt-12 pt-8 border-t border-gray-200 text-center text-sm text-gray-500">
            <p>© 2026 VUKA. All rights reserved. Built for African traders.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
