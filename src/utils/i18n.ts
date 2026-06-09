import type { Language, Translations } from '../types';

const en: Translations = {
  // Store
  'store.name': 'HARSH CSC EMITRA',
  'store.tagline': 'eMitra Digital Service Center & Common Service Centre',

  // Nav
  'nav.home': 'Home',
  'nav.cart': 'Cart',
  'nav.track': 'Track Order',
  'nav.software': 'Automation Software',

  // Home / Catalog
  'catalog.title': 'Digital Services',
  'catalog.subtitle': 'Government · Finance · Education · Insurance',
  'catalog.search': 'Search services...',
  'catalog.all': 'All Services',
  'catalog.noResults': 'No services found for your search.',
  'catalog.noResultsSub': 'Try a different keyword or category.',

  // Product Card
  'card.addToCart': 'Add to Cart',
  'card.free': 'FREE',
  'card.viewDetails': 'View Details',

  // Product Detail
  'detail.documents': 'Documents Required',
  'detail.turnaround': 'Turnaround Time',
  'detail.related': 'Similar Services',
  'detail.backToHome': '← Back to Services',

  // Cart Drawer
  'cart.title': 'Your Cart',
  'cart.empty': 'Your cart is empty',
  'cart.emptySub': 'Browse services and add them here.',
  'cart.checkout': 'Proceed to Checkout',
  'cart.total': 'Total',
  'cart.items': 'items',
  'cart.item': 'item',
  'cart.remove': 'Remove',
  'cart.clear': 'Clear Cart',

  // Checkout
  'checkout.title': 'Checkout',
  'checkout.delivery': 'Delivery Method',
  'checkout.digital': 'Digital Delivery (WhatsApp / Email)',
  'checkout.pickup': 'Visit Our Shop (In-Person)',
  'checkout.digital.desc': 'Documents delivered digitally — no travel needed.',
  'checkout.pickup.desc': 'Collect your documents from our center.',
  'checkout.free': 'FREE',
  'checkout.customerInfo': 'Your Information',
  'checkout.name': 'Full Name',
  'checkout.email': 'Email Address',
  'checkout.phone': 'Mobile Number',
  'checkout.notes': 'Document Drive Link / Notes',
  'checkout.notes.placeholder': 'Paste Google Drive link or any instructions...',
  'checkout.orderSummary': 'Order Summary',
  'checkout.placeOrder': 'Place Order & Get OTP',
  'checkout.processing': 'Placing Order...',
  'checkout.required': 'required',

  // OTP
  'otp.title': 'Verify Your Mobile',
  'otp.subtitle': 'Enter the 6-digit OTP sent to',
  'otp.verify': 'Verify OTP',
  'otp.verifying': 'Verifying...',
  'otp.resend': 'Resend OTP',
  'otp.resendIn': 'Resend in',
  'otp.sec': 's',
  'otp.wrongNumber': 'Wrong number?',
  'otp.backToCheckout': 'Back to Checkout',
  'otp.success': 'OTP Verified! Redirecting...',

  // Tracking
  'track.title': 'Track Order',
  'track.ref': 'Order Reference',
  'track.search': 'Track',
  'track.refPlaceholder': 'Enter order ref e.g. CSC-2024-001234',
  'track.customer': 'Customer',
  'track.service': 'Service',
  'track.placed': 'Order Placed',
  'track.delivery': 'Delivery',
  'track.total': 'Total',
  'track.payNow': 'Pay Now',
  'track.digitalDelivery': 'Digital (WhatsApp / Email)',
  'track.shopVisit': 'Shop Visit',
  'track.completionInfo': 'Completion Details',
  'track.notFound': 'Order not found. Please check your reference number.',

  // Status steps
  'status.verified': 'Order Verified',
  'status.verified.desc': 'Your order has been confirmed and logged.',
  'status.under_review': 'Documents Under Review',
  'status.under_review.desc': 'Our team is reviewing your documents.',
  'status.processing': 'Processing',
  'status.processing.desc': 'Your documents are being prepared.',
  'status.paid': 'Payment Received',
  'status.paid.desc': 'Payment confirmed. Final processing underway.',
  'status.completed': 'Completed & Delivered',
  'status.completed.desc': 'Your documents are ready and delivered.',

  // Common
  'common.loading': 'Loading...',
  'common.error': 'Something went wrong. Please try again.',
  'common.rupee': '₹',
  'common.back': 'Back',
  'common.close': 'Close',
};

const hi: Translations = {
  // Store
  'store.name': 'HARSH CSC EMITRA',
  'store.tagline': 'ई-मित्र डिजिटल सेवा केंद्र और कॉमन सर्विस सेंटर',

  // Nav
  'nav.home': 'होम',
  'nav.cart': 'कार्ट',
  'nav.track': 'ऑर्डर ट्रैक करें',
  'nav.software': 'ऑटोमेशन सॉफ्टवेयर',

  // Home / Catalog
  'catalog.title': 'डिजिटल सेवाएं',
  'catalog.subtitle': 'सरकार · वित्त · शिक्षा · बीमा',
  'catalog.search': 'सेवाएं खोजें...',
  'catalog.all': 'सभी सेवाएं',
  'catalog.noResults': 'आपकी खोज के लिए कोई सेवा नहीं मिली।',
  'catalog.noResultsSub': 'कोई अलग कीवर्ड या श्रेणी आज़माएं।',

  // Product Card
  'card.addToCart': 'कार्ट में जोड़ें',
  'card.free': 'निःशुल्क',
  'card.viewDetails': 'विवरण देखें',

  // Product Detail
  'detail.documents': 'आवश्यक दस्तावेज',
  'detail.turnaround': 'समयसीमा',
  'detail.related': 'समान सेवाएं',
  'detail.backToHome': '← सेवाओं पर वापस जाएं',

  // Cart Drawer
  'cart.title': 'आपकी कार्ट',
  'cart.empty': 'आपकी कार्ट खाली है',
  'cart.emptySub': 'सेवाएं देखें और यहाँ जोड़ें।',
  'cart.checkout': 'चेकआउट पर जाएं',
  'cart.total': 'कुल',
  'cart.items': 'आइटम',
  'cart.item': 'आइटम',
  'cart.remove': 'हटाएं',
  'cart.clear': 'कार्ट साफ़ करें',

  // Checkout
  'checkout.title': 'चेकआउट',
  'checkout.delivery': 'डिलीवरी विधि',
  'checkout.digital': 'डिजिटल डिलीवरी (WhatsApp / Email)',
  'checkout.pickup': 'हमारी दुकान पर आएं',
  'checkout.digital.desc': 'दस्तावेज़ डिजिटल रूप से वितरित — यात्रा की आवश्यकता नहीं।',
  'checkout.pickup.desc': 'हमारे केंद्र से अपने दस्तावेज़ लें।',
  'checkout.free': 'निःशुल्क',
  'checkout.customerInfo': 'आपकी जानकारी',
  'checkout.name': 'पूरा नाम',
  'checkout.email': 'ईमेल पता',
  'checkout.phone': 'मोबाइल नंबर',
  'checkout.notes': 'दस्तावेज़ ड्राइव लिंक / नोट्स',
  'checkout.notes.placeholder': 'Google Drive लिंक या कोई निर्देश पेस्ट करें...',
  'checkout.orderSummary': 'ऑर्डर सारांश',
  'checkout.placeOrder': 'ऑर्डर दें और OTP प्राप्त करें',
  'checkout.processing': 'ऑर्डर दिया जा रहा है...',
  'checkout.required': 'आवश्यक',

  // OTP
  'otp.title': 'अपना मोबाइल सत्यापित करें',
  'otp.subtitle': 'भेजा गया 6-अंकीय OTP दर्ज करें',
  'otp.verify': 'OTP सत्यापित करें',
  'otp.verifying': 'सत्यापित किया जा रहा है...',
  'otp.resend': 'OTP फिर भेजें',
  'otp.resendIn': 'पुनः भेजें',
  'otp.sec': 'सेकंड में',
  'otp.wrongNumber': 'गलत नंबर?',
  'otp.backToCheckout': 'चेकआउट पर वापस',
  'otp.success': 'OTP सत्यापित! रीडायरेक्ट हो रहा है...',

  // Tracking
  'track.title': 'ऑर्डर ट्रैक करें',
  'track.ref': 'ऑर्डर संदर्भ',
  'track.search': 'ट्रैक करें',
  'track.refPlaceholder': 'ऑर्डर संदर्भ दर्ज करें जैसे CSC-2024-001234',
  'track.customer': 'ग्राहक',
  'track.service': 'सेवा',
  'track.placed': 'ऑर्डर दिया गया',
  'track.delivery': 'डिलीवरी',
  'track.total': 'कुल',
  'track.payNow': 'अभी भुगतान करें',
  'track.digitalDelivery': 'डिजिटल (WhatsApp / Email)',
  'track.shopVisit': 'दुकान पर आएं',
  'track.completionInfo': 'पूर्णता विवरण',
  'track.notFound': 'ऑर्डर नहीं मिला। कृपया अपना संदर्भ नंबर जांचें।',

  // Status steps
  'status.verified': 'ऑर्डर सत्यापित',
  'status.verified.desc': 'आपका ऑर्डर पुष्टि और दर्ज किया गया है।',
  'status.under_review': 'दस्तावेज़ समीक्षाधीन',
  'status.under_review.desc': 'हमारी टीम आपके दस्तावेज़ों की समीक्षा कर रही है।',
  'status.processing': 'प्रक्रियाधीन',
  'status.processing.desc': 'आपके दस्तावेज़ तैयार किए जा रहे हैं।',
  'status.paid': 'भुगतान प्राप्त',
  'status.paid.desc': 'भुगतान की पुष्टि। अंतिम प्रक्रिया जारी।',
  'status.completed': 'पूर्ण और वितरित',
  'status.completed.desc': 'आपके दस्तावेज़ तैयार हैं और वितरित किए गए।',

  // Common
  'common.loading': 'लोड हो रहा है...',
  'common.error': 'कुछ गलत हुआ। कृपया पुनः प्रयास करें।',
  'common.rupee': '₹',
  'common.back': 'वापस',
  'common.close': 'बंद करें',
};

const translations: Record<Language, Translations> = { en, hi };

export function t(key: string, lang: Language): string {
  return translations[lang][key] ?? translations['en'][key] ?? key;
}

export function createT(lang: Language) {
  return (key: string) => t(key, lang);
}
