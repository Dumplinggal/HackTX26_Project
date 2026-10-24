/**
 * Card Finder Pro - Bank Intelligence & Application Rulebook Database
 * Comprehensive profiles for 14 major card issuers including proprietary underwriting rules,
 * credit bureau pull trends, transfer partner networks, and direct reconsideration hotlines.
 */

const BANK_PROFILES = {
  "Chase": {
    name: "JPMorgan Chase Bank, N.A.",
    shortName: "Chase",
    logoColor: "#117aca",
    rewardsEcosystem: "Chase Ultimate Rewards®",
    ecosystemDescription: "One of the most versatile point programs in the world. Points transfer 1:1 to premium airline & hotel partners, or redeem with a 25%-50% bonus on Sapphire cards.",
    transferPartners: [
      { name: "World of Hyatt", type: "Hotel", ratio: "1:1", valueNote: "Best hotel transfer value (2.0¢+ avg)" },
      { name: "United Airlines MileagePlus", type: "Airline", ratio: "1:1", valueNote: "Star Alliance global network" },
      { name: "Southwest Rapid Rewards", type: "Airline", ratio: "1:1", valueNote: "Domestic flights & 2 free checked bags" },
      { name: "Air Canada Aeroplan", type: "Airline", ratio: "1:1", valueNote: "Exceptional Star Alliance awards" },
      { name: "British Airways Avios", type: "Airline", ratio: "1:1", valueNote: "Oneworld short-haul sweet spots" },
      { name: "Marriott Bonvoy", type: "Hotel", ratio: "1:1", valueNote: "Global hotel footprint" }
    ],
    underwritingRules: [
      { title: "Chase 5/24 Rule", desc: "You will almost certainly be rejected if you have opened 5 or more personal credit cards with ANY bank in the past 24 months." },
      { title: "2/30 Velocity Rule", desc: "You cannot be approved for more than 2 Chase cards in a 30-day window." },
      { title: "Sapphire 48-Month Rule", desc: "You can only receive a welcome bonus on ONE Sapphire card (Preferred or Reserve) once every 48 months." },
      { title: "Maximum Credit Line", desc: "Chase rarely extends total credit across all your Chase cards exceeding 50% of your reported annual income." }
    ],
    bureauPulled: "Experian (majority of US states), occasionally Equifax in the Southeast",
    hasPreApproval: true,
    preApprovalNote: "Chase offers an online 'Pre-Qualified Offers' tool with a soft credit pull that won't impact your score.",
    customerServicePhone: "1-800-432-3117",
    reconsiderationPhone: "1-888-270-2127",
    customerSatisfaction: "J.D. Power #1 for National Credit Card Customer Satisfaction (4.9/5)",
    mobileAppRating: "4.8★ iOS (5M+ reviews) / 4.6★ Android",
    headquarters: "New York, NY",
    instantCardNumber: "Available immediately via Chase Mobile App & Apple Pay upon approval"
  },
  "American Express": {
    name: "American Express National Bank",
    shortName: "American Express",
    logoColor: "#006fcf",
    rewardsEcosystem: "Membership Rewards®",
    ecosystemDescription: "Top-tier international travel rewards program with 20+ transfer airline and hotel partners and extensive lifestyle statement credit partnerships.",
    transferPartners: [
      { name: "Delta SkyMiles", type: "Airline", ratio: "1:1", valueNote: "SkyTeam hub flights (small excise fee)" },
      { name: "Air France / KLM Flying Blue", type: "Airline", ratio: "1:1", valueNote: "Monthly promo award flights to Europe" },
      { name: "ANA Mileage Club", type: "Airline", ratio: "1:1", valueNote: "Incredible roundtrip business class sweet spots" },
      { name: "Hilton Honors", type: "Hotel", ratio: "1:2", valueNote: "2 Hilton points per 1 Amex point" },
      { name: "Virgin Atlantic Flying Club", type: "Airline", ratio: "1:1", valueNote: "Frequent 30% transfer bonuses" },
      { name: "Avianca LifeMiles", type: "Airline", ratio: "1:1", valueNote: "Star Alliance award bookings without fuel surcharges" }
    ],
    underwritingRules: [
      { title: "Once-Per-Lifetime Bonus Rule", desc: "You can only earn the welcome bonus on a specific Amex card once in your lifetime. Amex will warn you with a popup before pulling your credit." },
      { title: "5 Credit Card Limit", desc: "Amex limits consumers to a maximum of 5 active revolving credit cards at one time (charge cards like Gold/Platinum do not count towards this limit)." },
      { title: "2/90 Velocity Rule", desc: "You can be approved for at most 2 revolving Amex credit cards in a 90-day period." },
      { title: "Apply with Confidence", desc: "Soft-pull check before you commit: You only get a hard credit inquiry if you are approved AND choose to accept the card!" }
    ],
    bureauPulled: "Experian (almost exclusively nationwide). Existing customers usually receive soft pulls for subsequent cards!",
    hasPreApproval: true,
    preApprovalNote: "'Apply With Confidence' tells you if you're approved with NO impact to credit score until you accept.",
    customerServicePhone: "1-800-528-4800",
    reconsiderationPhone: "1-800-567-1083",
    customerSatisfaction: "J.D. Power Top 2 Ranking (4.9/5) - Renowned 24/7 in-app live chat and dispute protection",
    mobileAppRating: "4.9★ iOS (2.5M+ reviews) / 4.7★ Android",
    headquarters: "New York, NY",
    instantCardNumber: "Instant virtual card number issued immediately upon approval"
  },
  "Capital One": {
    name: "Capital One Financial Corporation",
    shortName: "Capital One",
    logoColor: "#004879",
    rewardsEcosystem: "Capital One Miles",
    ecosystemDescription: "Simple, flexible miles that can be erased against ANY travel purchase at 1.0¢ each, or transferred 1:1 to airline and hotel partners.",
    transferPartners: [
      { name: "Air Canada Aeroplan", type: "Airline", ratio: "1:1", valueNote: "Global Star Alliance flights" },
      { name: "Avianca LifeMiles", type: "Airline", ratio: "1:1", valueNote: "Excellent partner awards with no surcharges" },
      { name: "British Airways Avios", type: "Airline", ratio: "1:1", valueNote: "Oneworld short-haul & American Airlines flights" },
      { name: "Wyndham Rewards", type: "Hotel", ratio: "1:1", valueNote: "15k/30k flat rate Vacasa vacation rental sweet spots" },
      { name: "Turkish Airlines Miles&Smiles", type: "Airline", ratio: "1:1", valueNote: "Domestic flights on United from 10k miles" }
    ],
    underwritingRules: [
      { title: "Triple Bureau Pull", desc: "Capital One uniquely pulls all THREE major credit bureaus (Experian, TransUnion, Equifax) for every application." },
      { title: "1/6 Rule", desc: "You can generally only be approved for 1 Capital One card every 6 months." },
      { title: "2 Personal Card Limit", desc: "Capital One generally limits cardholders to 2 personal cards in their core lineup (Venture, Savor, Quicksilver)." },
      { title: "Subprime vs Prime Sensitivity", desc: "Prefers applicants who carry modest balances or have active revolving utilization rather than spotless 800+ credit churners." }
    ],
    bureauPulled: "All 3 bureaus pulled simultaneously (Experian, TransUnion, Equifax)",
    hasPreApproval: true,
    preApprovalNote: "Industry-leading pre-approval tool with pre-fill options and zero credit score impact.",
    customerServicePhone: "1-800-227-4825",
    reconsiderationPhone: "1-800-625-7866",
    customerSatisfaction: "4.7/5 - Excellent real-time fraud alerts and virtual Eno card numbers",
    mobileAppRating: "4.9★ iOS (4.5M+ reviews) / 4.6★ Android",
    headquarters: "McLean, VA",
    instantCardNumber: "Instant virtual card available in Capital One mobile app via Eno"
  },
  "Citi": {
    name: "Citigroup Inc.",
    shortName: "Citi",
    logoColor: "#003b70",
    rewardsEcosystem: "Citi ThankYou® Rewards",
    ecosystemDescription: "Highly lucrative cash back pairing with Citi Double Cash & Custom Cash, or high-value airline transfer partners with Citi Strata/Premier.",
    transferPartners: [
      { name: "Avianca LifeMiles", type: "Airline", ratio: "1:1", valueNote: "Star Alliance sweet spots" },
      { name: "Virgin Atlantic Flying Club", type: "Airline", ratio: "1:1", valueNote: "Delta flights & UK awards" },
      { name: "Choice Privileges", type: "Hotel", ratio: "1:2", valueNote: "2 Choice hotel points per 1 ThankYou point" },
      { name: "Qatar Airways Privilege Club", type: "Airline", ratio: "1:1", valueNote: "Qsuite business class redemptions" },
      { name: "Turkish Airlines Miles&Smiles", type: "Airline", ratio: "1:1", valueNote: "7.5k to 10k mile award flights" }
    ],
    underwritingRules: [
      { title: "8/65 Rule", desc: "Citi will only approve 1 card application in an 8-day period, and at most 2 applications in a 65-day period." },
      { title: "48-Month Family Rule", desc: "You cannot earn a welcome bonus on a card if you received a bonus or closed that card family in the past 48 months." },
      { title: "Inquiry Sensitivity", desc: "Citi is very sensitive to recent hard inquiries in the past 6 months (especially for cards like Premier/Custom Cash)." }
    ],
    bureauPulled: "Experian or Equifax (state-dependent, occasionally TransUnion in the Midwest)",
    hasPreApproval: true,
    preApprovalNote: "Offers an online pre-qualification check with soft inquiry.",
    customerServicePhone: "1-800-950-5114",
    reconsiderationPhone: "1-800-695-5171",
    customerSatisfaction: "4.5/5 - Generous 0% intro APR balance transfer terms",
    mobileAppRating: "4.8★ iOS (3M+ reviews) / 4.7★ Android",
    headquarters: "New York, NY",
    instantCardNumber: "Digital wallet push provisioning available on select cards"
  },
  "Wells Fargo": {
    name: "Wells Fargo & Company",
    shortName: "Wells Fargo",
    logoColor: "#d71e28",
    rewardsEcosystem: "Wells Fargo Rewards®",
    ecosystemDescription: "Modernized transfer program featuring competitive no-annual-fee options like Autograph and Active Cash.",
    transferPartners: [
      { name: "Air France / KLM Flying Blue", type: "Airline", ratio: "1:1", valueNote: "European awards with low fees" },
      { name: "Avianca LifeMiles", type: "Airline", ratio: "1:1", valueNote: "United & Star Alliance flights" },
      { name: "British Airways Avios", type: "Airline", ratio: "1:1", valueNote: "American Airlines domestic flights" },
      { name: "Choice Privileges", type: "Hotel", ratio: "1:2", valueNote: "Double points conversion rate" }
    ],
    underwritingRules: [
      { title: "1/6 Bonus Rule", desc: "You are not eligible for a welcome bonus if you opened another Wells Fargo credit card in the last 6 months." },
      { title: "Existing Customer Relationship", desc: "Underwriting odds improve noticeably if you have a checking, savings, or brokerage account with Wells Fargo." }
    ],
    bureauPulled: "Experian (majority) or TransUnion (West Coast)",
    hasPreApproval: true,
    preApprovalNote: "Wells Fargo offers an online pre-selected offers page with soft check.",
    customerServicePhone: "1-800-642-4720",
    reconsiderationPhone: "1-866-412-5956",
    customerSatisfaction: "4.6/5 - Industry-leading cell phone protection on $0 fee cards",
    mobileAppRating: "4.8★ iOS (4M+ reviews) / 4.7★ Android",
    headquarters: "San Francisco, CA",
    instantCardNumber: "Add to Apple Pay / Google Pay directly from the Wells Fargo app"
  },
  "Bank of America": {
    name: "Bank of America Corporation",
    shortName: "Bank of America",
    logoColor: "#e31837",
    rewardsEcosystem: "Bank of America Preferred Rewards®",
    ecosystemDescription: "The king of cash back multipliers for depositors. Qualifying balances in Merrill or BofA boost credit card rewards by 25%, 50%, or 75%!",
    transferPartners: [
      { name: "Statement Credit / Cash Deposit", type: "Cash", ratio: "1:1", valueNote: "Direct deposit into checking or investment account" },
      { name: "Travel Center Redemptions", type: "Travel", ratio: "1.0¢ - 1.25¢", valueNote: "Book flights, hotels, and rentals with no blackout dates" }
    ],
    underwritingRules: [
      { title: "2/3/4 Velocity Rule", desc: "Max 2 new BofA cards in a 2-month period, max 3 cards in 12 months, and max 4 cards in 24 months." },
      { title: "7/12 or 3/12 Rule", desc: "If you have a deposit account with BofA, max 7 new accounts in 12 months across all banks. Without a deposit account, max 3 new accounts in 12 months!" },
      { title: "Preferred Rewards Multiplier", desc: "$20k balance = +25% bonus; $50k = +50% bonus; $100k+ = +75% bonus (turning 3% into 5.25%!)." }
    ],
    bureauPulled: "Experian (majority) or TransUnion",
    hasPreApproval: true,
    preApprovalNote: "Offers customized pre-selected card offers online with soft inquiry.",
    customerServicePhone: "1-800-732-9194",
    reconsiderationPhone: "1-877-383-0120",
    customerSatisfaction: "4.6/5 - Unmatched cash back bonus tiers for savers and investors",
    mobileAppRating: "4.8★ iOS (3.8M+ reviews) / 4.7★ Android",
    headquarters: "Charlotte, NC",
    instantCardNumber: "Instant card provisioning to Apple Pay/Google Pay via BofA Mobile app"
  },
  "Barclays": {
    name: "Barclays Bank Delaware",
    shortName: "Barclays",
    logoColor: "#00aeef",
    rewardsEcosystem: "Barclays Rewards & Airline Travel",
    ecosystemDescription: "Famous for cobranded travel partnerships with JetBlue, Wyndham Rewards, Hawaiian Airlines, and AAdvantage Aviator cards.",
    transferPartners: [
      { name: "JetBlue TrueBlue", type: "Airline", ratio: "Direct Earning", valueNote: "Free checked bags and 5k anniversary points" },
      { name: "Wyndham Rewards", type: "Hotel", ratio: "Direct Earning", valueNote: "Vacasa rental homes and Caesars status match" },
      { name: "American Airlines AAdvantage", type: "Airline", ratio: "Direct Earning", valueNote: "Flight award redemptions" }
    ],
    underwritingRules: [
      { title: "6/24 Velocity Sensitivity", desc: "Barclays is notoriously inquiry and new account sensitive. Applicants with 6 or more new cards in 24 months are frequently denied." },
      { title: "Existing Card Activity Rule", desc: "Barclays often denies applicants for new cards if their existing Barclays credit card has had low or zero spending over the past 6 months." },
      { title: "Same Product Restriction", desc: "You generally cannot hold two of the exact same credit card concurrently." }
    ],
    bureauPulled: "TransUnion (almost exclusively nationwide)",
    hasPreApproval: false,
    preApprovalNote: "Barclays rarely offers soft-pull pre-approvals for co-branded cards.",
    customerServicePhone: "1-888-232-0780",
    reconsiderationPhone: "1-866-408-4064",
    customerSatisfaction: "4.4/5 - Excellent cobranded airline perks like free companion certificates",
    mobileAppRating: "4.7★ iOS (1M+ reviews) / 4.5★ Android",
    headquarters: "Wilmington, DE",
    instantCardNumber: "Instant card access provided for select cobrand airline tickets"
  },
  "Fidelity": {
    name: "Fidelity Investments / Elan Financial Services",
    shortName: "Fidelity",
    logoColor: "#437b38",
    rewardsEcosystem: "Fidelity Automatic Investment Rewards",
    ecosystemDescription: "Industry favorite for automated wealth accumulation. Earn unlimited 2% cash back deposited automatically into your Brokerage, Roth IRA, 529, or HSA.",
    transferPartners: [
      { name: "Fidelity Brokerage Account", type: "Investment", ratio: "1:1", valueNote: "Direct cash deposit for stocks, ETFs, or index funds" },
      { name: "Roth IRA / Traditional IRA", type: "Retirement", ratio: "1:1", valueNote: "Tax-advantaged retirement compounding" },
      { name: "Fidelity Health Savings Account (HSA)", type: "Health", ratio: "1:1", valueNote: "Triple-tax advantaged medical savings" },
      { name: "529 College Savings", type: "Education", ratio: "1:1", valueNote: "Tax-free growth for future education expenses" }
    ],
    underwritingRules: [
      { title: "Elan Financial Underwriting", desc: "Issued by Elan Financial Services (a division of U.S. Bank), known for conservative, steady underwriting standards." },
      { title: "Inquiry Sensitive", desc: "Prefers applicants with fewer than 2 hard inquiries on the pulled bureau in the prior 6 months." },
      { title: "Clean Credit History", desc: "Typically requires a FICO score of 690+ and no recent late payments or derogatory marks." }
    ],
    bureauPulled: "TransUnion (common) or Experian (depending on state)",
    hasPreApproval: false,
    preApprovalNote: "No standalone pre-approval tool, but pre-qualified offers sometimes appear inside Fidelity investor accounts.",
    customerServicePhone: "1-888-551-5147",
    reconsiderationPhone: "1-800-364-9648",
    customerSatisfaction: "4.9/5 - Top rated no-nonsense 2% cash back card with zero category tracking",
    mobileAppRating: "4.8★ iOS (2.5M+ reviews) / 4.7★ Android",
    headquarters: "Boston, MA",
    instantCardNumber: "Digital card push to Apple Pay & Google Pay inside Fidelity app"
  },
  "Navy Federal": {
    name: "Navy Federal Credit Union",
    shortName: "Navy Federal",
    logoColor: "#002d62",
    rewardsEcosystem: "Navy Federal Member Rewards",
    ecosystemDescription: "The largest credit union in the world, famous for exceptionally high credit limits, low interest rates, and generous relationship bonuses.",
    transferPartners: [
      { name: "Cash Back / Statement Credit", type: "Cash", ratio: "1:1", valueNote: "Instant cash deposit to savings or checking" },
      { name: "Travel Redemptions", type: "Travel", ratio: "1.0¢ per pt", valueNote: "Flights and hotels with no blackout dates" }
    ],
    underwritingRules: [
      { title: "Membership Eligibility Required", desc: "Must be active duty military, veteran, Department of Defense civilian, or an immediate family member of an eligible member." },
      { title: "91/3 Velocity Rule", desc: "Must wait at least 91 days and 3 full billing statements between new credit card applications with Navy Federal." },
      { title: "$80,000 Combined Credit Limit", desc: "NFCU caps total combined revolving credit limits across all personal credit cards at $80,000 per member." },
      { title: "Internal Relationship Score", desc: "NFCU calculates an internal score (100 to 450) where holding savings deposits and direct deposit boosts approval odds." }
    ],
    bureauPulled: "TransUnion (majority) or Equifax",
    hasPreApproval: true,
    preApprovalNote: "Offers an online pre-qualification tool for members that uses a soft credit inquiry.",
    customerServicePhone: "1-888-842-6328",
    reconsiderationPhone: "1-888-842-6328",
    customerSatisfaction: "4.95/5 - Consistently ranked highest in the nation for customer loyalty & high limits",
    mobileAppRating: "4.9★ iOS (1.2M+ reviews) / 4.8★ Android",
    headquarters: "Vienna, VA",
    instantCardNumber: "Virtual card details available immediately in NFCU mobile app"
  },
  "Robinhood": {
    name: "Robinhood Credit / Coastal Community Bank",
    shortName: "Robinhood",
    logoColor: "#00c805",
    rewardsEcosystem: "Robinhood Gold Cash Back",
    ecosystemDescription: "Modern flat-rate powerhouse offering 3% cash back on ALL purchases with no category limits, or 5% back on travel through Robinhood.",
    transferPartners: [
      { name: "Robinhood Brokerage Cash", type: "Investment", ratio: "1:1", valueNote: "Deposit into brokerage account to invest in stocks, crypto, or earn high APY" },
      { name: "Statement Credit", type: "Cash", ratio: "1:1", valueNote: "Erase card charges directly" }
    ],
    underwritingRules: [
      { title: "Robinhood Gold Subscription Required", desc: "Cardholders MUST maintain an active Robinhood Gold membership ($50/year or $5/month) to receive the 3% cash back rate." },
      { title: "Strict Debt-to-Income Underwriting", desc: "Underwritten by Coastal Community Bank; requires verified income and a healthy credit profile (typically 700+ FICO)." },
      { title: "Waitlist Access", desc: "Account rollout is managed through an active rolling invitation list." }
    ],
    bureauPulled: "Experian (majority)",
    hasPreApproval: false,
    preApprovalNote: "Invitations are sent to eligible Robinhood Gold subscribers.",
    customerServicePhone: "In-App 24/7 Phone Support Callback",
    reconsiderationPhone: "In-App Support Ticket & Chat",
    customerSatisfaction: "4.7/5 - Beautiful heavy stainless steel card and industry-leading 3% flat rate",
    mobileAppRating: "4.8★ iOS (4.5M+ reviews) / 4.7★ Android",
    headquarters: "Menlo Park, CA",
    instantCardNumber: "Disposable virtual card numbers and instant Apple Pay upon approval"
  },
  "Synchrony": {
    name: "Synchrony Financial",
    shortName: "Synchrony",
    logoColor: "#ffc836",
    rewardsEcosystem: "Synchrony Cashback & Retail Rewards",
    ecosystemDescription: "One of the largest issuers of retail cobranded and consumer cards in the US, known for accessible underwriting and straightforward cash back.",
    transferPartners: [
      { name: "Automatic Statement Credit", type: "Cash", ratio: "1:1", valueNote: "Automatically applies to monthly statement balance" }
    ],
    underwritingRules: [
      { title: "Inquiry Velocity Limits", desc: "Synchrony can be sensitive to rapid account openings and high numbers of recent hard inquiries within the past 6-12 months." },
      { title: "Credit Line Review Sensitivities", desc: "Monitors overall consumer credit reports and may adjust limits if credit card balances rise substantially across other banks." }
    ],
    bureauPulled: "TransUnion (majority of states)",
    hasPreApproval: true,
    preApprovalNote: "Many Synchrony cards offer an online pre-qualification check without affecting your credit score.",
    customerServicePhone: "1-866-419-4096",
    reconsiderationPhone: "1-800-480-0186",
    customerSatisfaction: "4.5/5 - Generous starting limits and zero-annual-fee 2% cash back",
    mobileAppRating: "4.7★ iOS (500k+ reviews) / 4.5★ Android",
    headquarters: "Stamford, CT",
    instantCardNumber: "Digital temporary account number provided upon approval"
  },
  "Bilt": {
    name: "Bilt Rewards / Wells Fargo",
    shortName: "Bilt",
    logoColor: "#111827",
    rewardsEcosystem: "Bilt Rewards Points",
    ecosystemDescription: "The only card program in the world that lets you earn valuable transfer points on rent with NO credit card transaction fees.",
    transferPartners: [
      { name: "World of Hyatt", type: "Hotel", ratio: "1:1", valueNote: "Most valuable hotel redemption program" },
      { name: "Alaska Airlines Mileage Plan", type: "Airline", ratio: "1:1", valueNote: "Rare exclusive transfer partner" },
      { name: "United Airlines MileagePlus", type: "Airline", ratio: "1:1", valueNote: "Star Alliance network" },
      { name: "Air Canada Aeroplan", type: "Airline", ratio: "1:1", valueNote: "Star Alliance sweet spots" },
      { name: "Air France / KLM Flying Blue", type: "Airline", ratio: "1:1", valueNote: "Periodic 75%-150% Rent Day transfer bonuses!" }
    ],
    underwritingRules: [
      { title: "5 Transactions per Billing Cycle", desc: "You MUST make at least 5 transactions per billing cycle on the card to earn points on your rent and everyday spend." },
      { title: "Wells Fargo Underwriting", desc: "Issued by Wells Fargo, so you need a clean credit profile (typically 680+ FICO)." }
    ],
    bureauPulled: "Experian (most states) or TransUnion",
    hasPreApproval: false,
    preApprovalNote: "No official soft-pull pre-approval tool, but instant credit decisions are standard.",
    customerServicePhone: "1-844-245-8761",
    reconsiderationPhone: "1-866-412-5956 (Wells Fargo Credit Operations)",
    customerSatisfaction: "4.9/5 - Huge fan favorite for renters and Rent Day bonus promos",
    mobileAppRating: "4.9★ iOS (150k+ reviews) / 4.8★ Android",
    headquarters: "New York, NY",
    instantCardNumber: "Instant virtual card in Bilt app upon approval to pay rent immediately"
  },
  "Discover": {
    name: "Discover Financial Services",
    shortName: "Discover",
    logoColor: "#ea580c",
    rewardsEcosystem: "Discover Cashback / Miles",
    ecosystemDescription: "Legendary for beginner-friendly credit building, 100% US-based customer support, and the first-year Cashback Match.",
    transferPartners: [
      { name: "Statement Credit / Bank Deposit", type: "Cash", ratio: "1:1", valueNote: "Redeem any amount anytime directly to bank" },
      { name: "Discounted Gift Cards", type: "Retail", ratio: "5%-20% bonus", valueNote: "Redeem cash back for extra value on 100+ partner brands" }
    ],
    underwritingRules: [
      { title: "1 Card in Year 1", desc: "Discover strictly permits only ONE credit card during your first 12 months as a customer." },
      { title: "Max 2 Cards Total", desc: "You can hold a lifetime maximum of 2 Discover credit cards at any one time." },
      { title: "Secured Card Graduation", desc: "Secured accounts are automatically reviewed monthly starting at month 7 to refund your deposit and graduate to unsecured." }
    ],
    bureauPulled: "Equifax or Experian (TransUnion for certain Midwest states)",
    hasPreApproval: true,
    preApprovalNote: "Excellent online pre-approval tool with 0 impact to credit score.",
    customerServicePhone: "1-800-347-2683",
    reconsiderationPhone: "1-888-676-3695",
    customerSatisfaction: "J.D. Power Top 2 Ranking (4.9/5) - 100% US-based customer service 24/7",
    mobileAppRating: "4.9★ iOS (4M+ reviews) / 4.7★ Android",
    headquarters: "Riverwoods, IL",
    instantCardNumber: "Account info available upon card delivery, expedited shipping upon request"
  },
  "U.S. Bank": {
    name: "U.S. Bancorp",
    shortName: "U.S. Bank",
    logoColor: "#0c2340",
    rewardsEcosystem: "U.S. Bank Altitude Rewards",
    ecosystemDescription: "High-value travel rewards, famous for mobile wallet (Apple Pay/Google Pay) 3x point multipliers worth 4.5% on travel.",
    transferPartners: [
      { name: "Real-Time Rewards", type: "Travel Instant Redemption", ratio: "1.5¢ per pt", valueNote: "Text-to-redeem on any direct airline, hotel, or rental car purchase" },
      { name: "Direct Travel Portal", type: "Travel Portal", ratio: "1.5¢ per pt", valueNote: "Book travel with 50% points bonus" }
    ],
    underwritingRules: [
      { title: "Inquiry Sensitive (0/6 or 1/12)", desc: "U.S. Bank is notoriously conservative. Prefer applicants with 0 new hard inquiries in the past 6 months and fewer than 2 in 12 months." },
      { title: "Existing Relationship Preferred", desc: "Having an existing checking account, CD, or mortgage with U.S. Bank significantly increases approval odds for premium cards." }
    ],
    bureauPulled: "TransUnion (common) or Experian",
    hasPreApproval: true,
    preApprovalNote: "Online pre-qualification page available for checking cards without score impact.",
    customerServicePhone: "1-800-285-8585",
    reconsiderationPhone: "1-800-947-1444",
    customerSatisfaction: "4.6/5 - Exceptional mobile wallet integration and travel statement credits",
    mobileAppRating: "4.8★ iOS (1.5M+ reviews) / 4.6★ Android",
    headquarters: "Minneapolis, MN",
    instantCardNumber: "Virtual card instant push to digital wallet for eligible applicants"
  }
};
