<script lang="ts">
  import { ChevronDown } from 'lucide-svelte';
  import { onMount } from 'svelte';
  import flatpickr from 'flatpickr';
  import 'flatpickr/dist/flatpickr.min.css';

  let dateInput: HTMLInputElement;

  const langs = ['EN', 'ZH', 'FR', 'KH', 'TL', 'MY'];
  let currentLang = $state('EN');
  let langBarOpen = $state(false);

  const photos = [
    { src: 'https://www.momondo.com/rimg/himg/41/36/ab/expedia_group-2563091-f312be-208161.jpg?width=968&height=607&crop=true', label: 'Pool' },
    { src: 'https://www.momondo.com/rimg/himg/d3/f6/b1/expedia_group-2563091-7f735f-086107.jpg?width=968&height=607&crop=true', label: 'Living Room' },
    { src: 'https://www.momondo.com/rimg/himg/ca/66/39/expedia_group-2563091-894a03-026649.jpg?width=968&height=607&crop=true', label: 'Living Room' },
    { src: 'https://www.momondo.com/rimg/himg/b1/fc/bb/expedia_group-2563091-2d9cd2-915235.jpg?width=968&height=607&crop=true', label: 'Suite' },
    { src: 'https://www.momondo.com/rimg/himg/fc/35/99/expedia_group-2563091-52475744-463858.jpg?width=968&height=607&crop=true', label: 'Suite' },
    { src: 'https://www.momondo.com/rimg/himg/ee/a4/ff/expedia_group-2563091-0ef437-963584.jpg?width=968&height=607&crop=true', label: 'View' },
    { src: 'https://www.momondo.com/rimg/himg/2e/70/98/expedia_group-2563091-27e506-972028.jpg?width=968&height=607&crop=true', label: 'Terrace' },
    { src: 'https://www.momondo.com/rimg/himg/1e/7a/43/expedia_group-2563091-077e5f-217156.jpg?width=968&height=607&crop=true', label: 'Building' },
    { src: 'https://www.momondo.com/rimg/himg/a3/dc/ce/expedia_group-2563091-5c9107-248060.jpg?width=968&height=607&crop=true', label: 'Room' },
    { src: 'https://www.momondo.com/rimg/himg/e7/dd/86/expedia_group-2563091-f231f3-306371.jpg?width=968&height=607&crop=true', label: 'Bathroom' },
  ];

  let currentSlide = $state(0);
  let autoplay: ReturnType<typeof setInterval>;

  function nextSlide() { currentSlide = (currentSlide + 1) % photos.length; }
  function prevSlide() { currentSlide = (currentSlide - 1 + photos.length) % photos.length; }
  function goToSlide(i: number) { currentSlide = i; }

  $effect(() => {
    autoplay = setInterval(nextSlide, 4500);
    return () => clearInterval(autoplay);
  });

  $effect(() => {
    fetch('https://ipapi.co/json/')
      .then(r => r.json())
      .then(data => {
        const country = data.country_code;
        const map: Record<string, string> = {
          'US': 'EN', 'GB': 'EN', 'AU': 'EN',
          'CN': 'ZH', 'TW': 'ZH', 'HK': 'ZH', 'SG': 'ZH',
          'FR': 'FR', 'BE': 'FR', 'CH': 'FR',
          'KH': 'KH',
          'PH': 'TL',
          'MY': 'MY', 'BN': 'MY',
          'JP': 'EN', 'KR': 'EN',
        };
        currentLang = map[country] ?? 'EN';
      })
      .catch(() => {
        currentLang = 'EN';
      });
  });

  let scrolled = $state(false);
  let showScrollTop = $state(false);

  $effect(() => {
    function handleScroll() {
      scrolled = window.scrollY > 50;
      showScrollTop = window.scrollY > 500;
    }
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  });

  function smoothScrollTo(target: number, duration = 1800) {
    const start = window.scrollY;
    const distance = target - start;
    let startTime: number | null = null;

    function easeInOutQuart(t: number) {
      return t < 0.5 ? 8 * t * t * t * t : 1 - Math.pow(-2 * t + 2, 4) / 2;
    }

    function step(timestamp: number) {
      if (!startTime) startTime = timestamp;
      const elapsed = timestamp - startTime;
      const progress = Math.min(elapsed / duration, 1);
      window.scrollTo(0, start + distance * easeInOutQuart(progress));
      if (progress < 1) requestAnimationFrame(step);
    }

    requestAnimationFrame(step);
  }

  function scrollToTop() {
    smoothScrollTo(0);
  }

  $effect(() => {
    function handleAnchorClick(e: MouseEvent) {
      const anchor = (e.target as HTMLElement).closest('a[href^="#"]') as HTMLAnchorElement | null;
      if (!anchor) return;
      const id = anchor.getAttribute('href')?.slice(1);
      if (!id) return;
      const el = document.getElementById(id);
      if (!el) return;
      e.preventDefault();
      const top = el.getBoundingClientRect().top + window.scrollY - 64;
      smoothScrollTo(top);
    }
    document.addEventListener('click', handleAnchorClick);
    return () => document.removeEventListener('click', handleAnchorClick);
  });

  // Enquiry form
  let formData = $state({ name: '', email: '', checkin: '', checkout: '', suite: '', message: '' });

  onMount(() => {
    flatpickr(dateInput, {
      mode: 'range',
      minDate: 'today',
      dateFormat: 'd M Y',
      showMonths: 2,
      disableMobile: false,
      onChange(selectedDates) {
        if (selectedDates[0]) formData.checkin = selectedDates[0].toISOString().split('T')[0];
        if (selectedDates[1]) formData.checkout = selectedDates[1].toISOString().split('T')[0];
      }
    });
  });

  let formStatus = $state<'idle' | 'sending' | 'sent' | 'error'>('idle');

  async function handleSubmit(e: Event) {
    e.preventDefault();
    formStatus = 'sending';
    try {
      const res = await fetch('/api/enquiry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      formStatus = data.success ? 'sent' : 'error';
    } catch {
      formStatus = 'error';
    }
  }
</script>

<svelte:head>
  <title>La Belle Résidence — Serviced Apartments Phnom Penh</title>
  <meta name="description" content="La Belle Residence offers luxury serviced apartments in Phnom Penh with rooftop jacuzzi, sunset bar, restaurant and spa. Best rates guaranteed on direct booking." />
  <meta name="keywords" content="Phnom Penh apartments, serviced apartments Cambodia, La Belle Residence, holiday rental Phnom Penh, rooftop pool Phnom Penh, long term stay Phnom Penh, 金边公寓, appartement Phnom Penh, លំនៅដ្ឋានភ្នំពេញ" />

  <!-- English -->
  <meta name="description" lang="en" content="Luxury serviced apartments in Phnom Penh with rooftop jacuzzi, sunset bar, restaurant and wine cellar. Direct booking lowest price guaranteed." />

  <!-- Chinese -->
  <meta name="description" lang="zh" content="金边豪华服务式公寓，拥有屋顶按摩浴缸、日落酒吧、餐厅和酒窖。直接预订价格最低保证。" />
  <meta name="keywords" lang="zh" content="金边公寓, 柬埔寨服务式公寓, 金边度假租赁, 屋顶泳池金边, 长期住宿金边" />

  <!-- French -->
  <meta name="description" lang="fr" content="Appartements de luxe à Phnom Penh avec jacuzzi sur le toit, bar coucher de soleil, restaurant et cave à vins. Prix le plus bas garanti en réservation directe." />
  <meta name="keywords" lang="fr" content="appartement Phnom Penh, location vacances Cambodge, séjour longue durée Phnom Penh, piscine rooftop Phnom Penh" />

  <!-- Khmer -->
  <meta name="description" lang="km" content="អាផាតមិនសេវាកម្ម贅រម្យក្នុងទីក្រុងភ្នំពេញ ជាមួយនឹង Jacuzzi នៅជាន់លើ បារ Sunset ភោជនីយដ្ឋាន និងជម្រករស់នៅរយៈពេលវែង។" />

  <!-- Tagalog -->
  <meta name="description" lang="tl" content="Luxury serviced apartments sa Phnom Penh na may rooftop jacuzzi, sunset bar, restaurant at wine cellar. Pinakamababang presyo garantisado sa direktang booking." />

  <!-- Bahasa Melayu -->
  <meta name="description" lang="ms" content="Apartment servis mewah di Phnom Penh dengan jacuzzi di atas bumbung, bar sunset, restoran dan wine cellar. Harga terendah dijamin untuk tempahan terus." />

  <!-- Open Graph -->
  <meta property="og:title" content="La Belle Résidence — Serviced Apartments Phnom Penh" />
  <meta property="og:description" content="Luxury serviced apartments with rooftop jacuzzi, sunset bar, restaurant and wine cellar. French touch, Khmer hospitality. Direct booking lowest price guaranteed." />
  <meta property="og:image" content="https://images.trvl-media.com/lodging/16000000/15290000/15285800/15285740/6bc4bfb2.jpg?impolicy=resizecrop&rw=1200&ra=fit" />
  <meta property="og:url" content="https://www.labelleresidence.com" />
  <meta property="og:type" content="website" />
  <meta property="og:locale" content="en_US" />
  <meta property="og:locale:alternate" content="zh_CN" />
  <meta property="og:locale:alternate" content="zh_TW" />
  <meta property="og:locale:alternate" content="fr_FR" />
  <meta property="og:locale:alternate" content="km_KH" />
  <meta property="og:locale:alternate" content="tl_PH" />
  <meta property="og:locale:alternate" content="ms_MY" />

  <!-- Twitter Card -->
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="La Belle Résidence — Serviced Apartments Phnom Penh" />
  <meta name="twitter:description" content="Luxury serviced apartments with rooftop jacuzzi, sunset bar and wine cellar. Direct booking lowest price guaranteed." />
  <meta name="twitter:image" content="https://images.trvl-media.com/lodging/16000000/15290000/15285800/15285740/6bc4bfb2.jpg?impolicy=resizecrop&rw=1200&ra=fit" />

  <!-- Canonical -->
  <link rel="canonical" href="https://www.labelleresidence.com" />

  <!-- Fonts -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous">
  <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;1,400&family=Inter:wght@300;400;500&display=swap" rel="stylesheet">

  {@html `<script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "LodgingBusiness",
    "name": "La Belle Résidence",
    "alternateName": [
      "拉贝尔公寓",
      "La Belle Résidence Phnom Penh",
      "លាបែលរេស៊ីដង់",
      "La Belle Résidence Appartements"
    ],
    "description": "Luxury serviced apartments in Phnom Penh with rooftop jacuzzi, sunset bar, restaurant and wine cellar. French touch with Khmer hospitality.",
    "url": "https://www.labelleresidence.com",
    "telephone": "+85531636123",
    "email": "reservations@labelleresidence.com",
    "address": {
      "@type": "PostalAddress",
      "streetAddress": "#1491 Street 81BT, Sangkat Boeng Tumpun",
      "addressLocality": "Phnom Penh",
      "addressRegion": "Khan Mean Chey",
      "postalCode": "12351",
      "addressCountry": "KH"
    },
    "geo": {
      "@type": "GeoCoordinates",
      "latitude": 11.5406,
      "longitude": 104.9180
    },
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": "8.7",
      "reviewCount": "353",
      "bestRating": "10"
    },
    "priceRange": "$31-$61",
    "checkinTime": "14:00",
    "checkoutTime": "12:00",
    "numberOfRooms": 20,
    "petsAllowed": true,
    "currenciesAccepted": "USD, KHR",
    "paymentAccepted": "Cash, Credit Card",
    "amenityFeature": [
      {"@type": "LocationFeatureSpecification", "name": "Free WiFi", "value": true},
      {"@type": "LocationFeatureSpecification", "name": "Free Parking", "value": true},
      {"@type": "LocationFeatureSpecification", "name": "Rooftop Jacuzzi", "value": true},
      {"@type": "LocationFeatureSpecification", "name": "Restaurant", "value": true},
      {"@type": "LocationFeatureSpecification", "name": "Wine Cellar", "value": true},
      {"@type": "LocationFeatureSpecification", "name": "Fitness Center", "value": true},
      {"@type": "LocationFeatureSpecification", "name": "Swimming Pool", "value": true},
      {"@type": "LocationFeatureSpecification", "name": "Pet Friendly", "value": true},
      {"@type": "LocationFeatureSpecification", "name": "Airport Transfer", "value": true},
      {"@type": "LocationFeatureSpecification", "name": "Long Term Stays", "value": true}
    ],
    "sameAs": [
      "https://www.facebook.com/labelleresidence",
      "https://www.youtube.com/channel/UCXCAhI5BOY6cjiPcRfxZbvw",
      "https://www.tripadvisor.com/Hotel_Review-g293940-d10112631-Reviews-La_Belle_Residence-Phnom_Penh.html"
    ]
  }
  </script>`}
</svelte:head>

<!-- NAVBAR -->
<nav class={`fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-8 transition-all duration-500 ${
  scrolled
    ? 'bg-stone-900/95 backdrop-blur-md shadow-lg py-3'
    : 'bg-black/20 backdrop-blur-sm py-4'
}`}>
  <div class="text-white font-light tracking-[0.3em] text-sm uppercase">La Belle Résidence</div>
  <div class={`hidden md:flex items-center gap-8 text-sm font-light tracking-wide transition-colors duration-500 ${
    scrolled ? 'text-white/70' : 'text-white/80'
  }`}>
    <a href="#rooms" class="hover:text-white transition">Rooms</a>
    <a href="#rooftop" class="hover:text-white transition">Rooftop</a>
    <a href="#restaurant" class="hover:text-white transition">Restaurant</a>
    <a href="#amenities" class="hover:text-white transition">Amenities</a>
    <a href="#enquiry" class="hover:text-white transition">Contact</a>
  </div>
  <div class="flex items-center gap-4">
    <button
      onclick={() => langBarOpen = !langBarOpen}
      class="text-white/60 hover:text-white text-xs tracking-widest uppercase transition"
    >
      {currentLang}
    </button>
    <a href="#enquiry" class="bg-white text-black text-xs font-medium px-4 py-2 rounded-full hover:bg-white/90 transition tracking-wide">
      Book Direct
    </a>
  </div>
</nav>

<!-- LANGUAGE BAR -->
<div class={`fixed top-16 left-0 right-0 z-40 transition-all duration-300 overflow-hidden ${langBarOpen ? 'max-h-16' : 'max-h-0'}`}>
  <div class="bg-stone-900/95 backdrop-blur-sm border-b border-white/5 px-8 py-3 flex items-center justify-center gap-8">
    {#each [
      { code: 'EN', label: 'English' },
      { code: 'ZH', label: '中文' },
      { code: 'FR', label: 'Français' },
      { code: 'KH', label: 'ខ្មែរ' },
      { code: 'TL', label: 'Filipino' },
      { code: 'MY', label: 'Melayu' }
    ] as lang}
      <button
        onclick={() => { currentLang = lang.code; langBarOpen = false; }}
        class={`text-xs tracking-widest uppercase transition ${currentLang === lang.code ? 'text-amber-400' : 'text-white/40 hover:text-white'}`}
      >
        {lang.label}
      </button>
    {/each}
  </div>
</div>

<!-- HERO -->
<section class="relative h-screen w-full overflow-hidden">
  <img
    src="https://www.momondo.com/rimg/himg/41/36/ab/expedia_group-2563091-f312be-208161.jpg?width=968&height=607&crop=true"
    alt="La Belle Residence Phnom Penh"
    class="absolute inset-0 w-full h-full object-cover"
  />
  <div class="absolute inset-0 bg-linear-to-br from-stone-900/80 via-stone-800/60 to-amber-900/50"></div>
  <div class="relative z-10 flex flex-col items-center justify-center h-full text-center px-4">
    <p class="text-amber-400/80 text-xs tracking-[0.4em] uppercase mb-4 font-light">Phnom Penh · Cambodia</p>
    <h1 class="text-5xl md:text-7xl mb-6" style="font-family: 'Playfair Display', serif;">
      <span class="text-amber-400">La Belle</span><br/>
      <em class="text-amber-400">Résidence</em>
    </h1>
    <p class="text-white/80 text-lg md:text-xl font-light max-w-xl mx-auto mb-2">
      Serviced apartments with a French touch<br/>and Khmer hospitality
    </p>
    <p class="text-amber-300/90 text-sm font-light tracking-wide mb-10">
      Rooftop Jacuzzi · Sunset Bar · Restaurant · Spa · Weight Room
    </p>
    <div class="flex gap-4 flex-wrap justify-center">
      <a href="https://wa.me/85531636123" target="_blank" class="bg-white text-black px-8 py-3 rounded-full text-sm font-medium hover:bg-amber-50 transition tracking-wide">
        Book Direct — Best Rate
      </a>
      <a href="#rooms" class="border border-white/50 text-white px-8 py-3 rounded-full text-sm font-light hover:border-white transition tracking-wide">
        Explore Rooms
      </a>
    </div>
  </div>
  <div class="absolute bottom-8 left-1/2 -translate-x-1/2 text-white/50 animate-bounce">
    <ChevronDown class="w-6 h-6" />
  </div>
</section>

<!-- DIRECT BOOKING BANNER -->
<div class="bg-amber-700 py-4 px-8">
  <div class="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">

    <div class="flex items-center gap-8">
      <div>
        <p class="text-white text-sm font-medium tracking-wide">Direct Booking — Lowest Price Guaranteed</p>
        <p class="text-amber-200/70 text-xs font-light">No OTA fees. No middleman. Book direct and save.</p>
      </div>
      <div class="w-px h-10 bg-amber-500/50 hidden md:block"></div>
      <div>
        <p class="text-white text-sm font-medium tracking-wide">Long Term Stays Welcome</p>
        <p class="text-amber-200/70 text-xs font-light">Weekly, monthly and extended stay rates available.</p>
      </div>
    </div>

    <div class="flex items-center gap-6">
      <a
        href="https://wa.me/85531636123"
        target="_blank"
        class="bg-white text-amber-800 text-xs font-medium px-6 py-2 rounded-full hover:bg-amber-50 transition tracking-wide whitespace-nowrap"
      >
        WhatsApp to Book
      </a>
      <a
        href="mailto:reservations@labelleresidence.com"
        class="text-white/70 text-xs hover:text-white transition tracking-wide whitespace-nowrap"
      >
        or Email Us
      </a>
    </div>

  </div>
</div>


<!-- PHOTO CAROUSEL -->
<section class="relative w-full h-[500px] overflow-hidden bg-stone-900">
  {#each photos as photo, i}
    <div class={`absolute inset-0 transition-opacity duration-1000 ${i === currentSlide ? 'opacity-100' : 'opacity-0'}`}>
      <img src={photo.src} alt={photo.label} class="w-full h-full object-cover" />
    </div>
  {/each}
  <button onclick={prevSlide} class="absolute left-4 top-1/2 -translate-y-1/2 z-10 bg-black/40 hover:bg-black/60 text-white rounded-full p-3 transition">
    <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" /></svg>
  </button>
  <button onclick={nextSlide} class="absolute right-4 top-1/2 -translate-y-1/2 z-10 bg-black/40 hover:bg-black/60 text-white rounded-full p-3 transition">
    <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" /></svg>
  </button>
  <div class="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 flex gap-2">
    {#each photos as _, i}
      <button onclick={() => goToSlide(i)} class={`w-2 h-2 rounded-full transition ${i === currentSlide ? 'bg-white' : 'bg-white/40'}`}></button>
    {/each}
  </div>
  <div class="absolute bottom-4 right-6 text-white/50 text-xs z-10">{currentSlide + 1} / {photos.length}</div>
</section>

<!-- CREDIBILITY BAR -->
<div class="bg-stone-300 py-6 px-8 border-y border-stone-400">
  <div class="max-w-6xl mx-auto flex flex-wrap items-center justify-center gap-12 text-center">
    <div>
      <p class="text-amber-600 text-2xl font-light" style="font-family: 'Playfair Display', serif;">4.5 / 5</p>
      <p class="text-stone-400 text-xs tracking-widest uppercase mt-1">TripAdvisor</p>
    </div>
    <div class="w-px h-8 bg-stone-200 hidden md:block"></div>
    <div>
      <p class="text-amber-600 text-2xl font-light" style="font-family: 'Playfair Display', serif;">8.7 / 10</p>
      <p class="text-stone-400 text-xs tracking-widest uppercase mt-1">353 Reviews</p>
    </div>
    <div class="w-px h-8 bg-stone-200 hidden md:block"></div>
    <div>
      <p class="text-amber-600 text-2xl font-light" style="font-family: 'Playfair Display', serif;">9.1</p>
      <p class="text-stone-400 text-xs tracking-widest uppercase mt-1">Staff Score</p>
    </div>
    <div class="w-px h-8 bg-stone-200 hidden md:block"></div>
    <div>
      <p class="text-amber-600 text-2xl font-light" style="font-family: 'Playfair Display', serif;">20</p>
      <p class="text-stone-400 text-xs tracking-widest uppercase mt-1">Suites</p>
    </div>
    <div class="w-px h-8 bg-stone-200 hidden md:block"></div>
    <div>
      <p class="text-amber-600 text-2xl font-light" style="font-family: 'Playfair Display', serif;">#16</p>
      <p class="text-stone-400 text-xs tracking-widest uppercase mt-1">of 342 Phnom Penh</p>
    </div>
  </div>
</div>

<!-- ROOFTOP SECTION -->
<section id="rooftop" class="py-24 px-8 bg-stone-900 text-white">
  <div class="max-w-6xl mx-auto">

    <div class="text-center mb-16">
      <p class="text-amber-400 text-xs tracking-[0.4em] uppercase mb-4">6th Floor</p>
      <h2 class="text-4xl md:text-5xl mb-6" style="font-family: 'Playfair Display', serif;">
        Sunset Bar &<br/><em>Rooftop Terrace</em>
      </h2>
      <p class="text-white/60 font-light leading-relaxed max-w-2xl mx-auto mb-16">
        Watch the sun melt over Phnom Penh from our rooftop jacuzzi and sunset bar. Pool table, sun deck and city views — the perfect end to any day in Cambodia's vibrant capital.
      </p>
    </div>

    <div class="grid md:grid-cols-2 gap-6">
      <div class="rounded-2xl overflow-hidden aspect-video">
        <img
          src="https://images.trvl-media.com/lodging/16000000/15290000/15285800/15285740/6bc4bfb2.jpg?impolicy=resizecrop&rw=800&ra=fit"
          alt="Rooftop Pool"
          class="w-full h-full object-cover hover:scale-105 transition duration-700"
        />
      </div>
      <div class="rounded-2xl overflow-hidden aspect-video">
        <img
          src="https://images.trvl-media.com/lodging/16000000/15290000/15285800/15285740/57cfef6a.jpg?impolicy=resizecrop&rw=800&ra=fit"
          alt="Rooftop Pool Table"
          class="w-full h-full object-cover hover:scale-105 transition duration-700"
        />
      </div>
    </div>

    <div class="text-center mt-12">
      <a
        href="https://wa.me/85531636123"
        target="_blank"
        class="inline-block border border-amber-400 text-amber-400 px-6 py-3 rounded-full text-sm hover:bg-amber-400 hover:text-black transition"
      >
        Reserve Your Stay
      </a>
    </div>
  </div>
</section>

<!-- ROOMS SECTION -->
<section id="rooms" class="pt-12 pb-24 px-8 bg-stone-50">
  <div class="max-w-6xl mx-auto">
    <div class="text-center mb-12">
      <p class="text-amber-600 text-xs tracking-[0.4em] uppercase mb-3">Accommodations</p>
      <h2 class="text-4xl md:text-5xl text-stone-800" style="font-family: 'Playfair Display', serif;">Our Suites</h2>
    </div>
    <div class="grid md:grid-cols-3 gap-8">
      {#each [
        { name: '1 Bedroom Suite', desc: 'Perfect for couples or solo travelers. Fully equipped kitchen, separate living room, city views.', size: '45–55 m²', img: 'https://www.momondo.com/rimg/himg/d3/f6/b1/expedia_group-2563091-7f735f-086107.jpg?width=968&height=607&crop=true' },
        { name: '2 Bedroom Suite', desc: 'Ideal for small families or colleagues. Two private bedrooms, spacious living area, full kitchen.', size: '70–85 m²', img: 'https://www.momondo.com/rimg/himg/ca/66/39/expedia_group-2563091-894a03-026649.jpg?width=968&height=607&crop=true' },
        { name: '3 Bedroom Suite', desc: 'Our flagship family suite. Three bedrooms, two bathrooms, full kitchen, generous living space.', size: '100–120 m²', img: 'https://www.momondo.com/rimg/himg/b1/fc/bb/expedia_group-2563091-2d9cd2-915235.jpg?width=968&height=607&crop=true' }
      ] as room}
        <div class="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition">
          <div class="aspect-video overflow-hidden">
            <img src={room.img} alt={room.name} class="w-full h-full object-cover hover:scale-105 transition duration-500" />
          </div>
          <div class="p-6">
            <p class="text-amber-600 text-xs tracking-widest uppercase mb-2">{room.size}</p>
            <h3 class="text-xl text-stone-800 mb-3" style="font-family: 'Playfair Display', serif;">{room.name}</h3>
            <p class="text-stone-500 text-sm font-light leading-relaxed mb-6">{room.desc}</p>
            <a href="https://wa.me/85531636123" target="_blank" class="block text-center border border-stone-300 text-stone-600 py-2 rounded-full text-sm hover:border-amber-500 hover:text-amber-600 transition">
              Enquire
            </a>
          </div>
        </div>
      {/each}
    </div>
  </div>
</section>

<!-- TRANSPORT STRIP -->
<div class="bg-stone-300 py-8 px-8">
  <div class="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-center gap-12 text-center">
    <div>
      <p class="text-amber-700 text-xl mb-1" style="font-family: 'Playfair Display', serif;">Private Car</p>
      <p class="text-stone-500 text-sm font-light tracking-wide">Airport transfers & city tours</p>
    </div>
    <div class="w-px h-10 bg-stone-400 hidden md:block"></div>
    <div>
      <p class="text-amber-700 text-xl mb-1" style="font-family: 'Playfair Display', serif;">Tuk Tuk</p>
      <p class="text-stone-500 text-sm font-light tracking-wide">Local rides & market runs</p>
    </div>
    <div class="w-px h-10 bg-stone-400 hidden md:block"></div>
    <div>
      <p class="text-amber-700 text-xl mb-1" style="font-family: 'Playfair Display', serif;">Bicycle Rental</p>
      <p class="text-stone-500 text-sm font-light tracking-wide">Explore at your own pace</p>
    </div>
    <div class="w-px h-10 bg-stone-400 hidden md:block"></div>
    <div>
      <p class="text-amber-700 text-xl mb-1" style="font-family: 'Playfair Display', serif;">Moto Rental</p>
      <p class="text-stone-500 text-sm font-light tracking-wide">Freedom around the city</p>
    </div>
  </div>
</div>

<!-- RESTAURANT SECTION -->
<section id="restaurant" class="py-24 px-8 bg-stone-900 text-white">
  <div class="max-w-6xl mx-auto grid md:grid-cols-2 gap-16 items-center">
    <div class="rounded-2xl overflow-hidden aspect-square">
      <img
        src="https://images.trvl-media.com/lodging/16000000/15290000/15285800/15285740/580c631e.jpg?impolicy=resizecrop&rw=800&ra=fit"
        alt="La Belle Residence Restaurant"
        class="w-full h-full object-cover"
      />
    </div>
    <div>
      <p class="text-amber-400 text-xs tracking-[0.4em] uppercase mb-4">On Site</p>
      <h2 class="text-4xl md:text-5xl mb-6" style="font-family: 'Playfair Display', serif;">
        Restaurant &<br/><em>Wine Cellar</em>
      </h2>
      <p class="text-white/60 font-light leading-relaxed mb-6">
        From morning coffee to evening cocktails, La Belle's restaurant serves fresh,
        honest food in a relaxed setting. Breakfast daily, with lunch and dinner
        available throughout the week.
      </p>
      <p class="text-white/60 font-light leading-relaxed mb-8">
        Our wine cellar features a carefully selected range of French and international
        labels — exceptional value by any standard in Phnom Penh.
      </p>
      <div class="grid grid-cols-3 gap-4 mb-8">
        {#each ['Breakfast', 'Lunch', 'Dinner'] as meal}
          <div class="border border-white/10 rounded-xl p-4 text-center">
            <p class="text-white/80 text-sm font-light">{meal}</p>
          </div>
        {/each}
      </div>
      <a
        href="https://wa.me/85531636123"
        target="_blank"
        class="inline-block border border-amber-400 text-amber-400 px-6 py-3 rounded-full text-sm hover:bg-amber-400 hover:text-black transition"
      >
        Reserve a Table
      </a>
    </div>
  </div>
</section>

<!-- AMENITIES -->
<section id="amenities" class="pt-16 pb-8 px-8 bg-stone-50 overflow-hidden">
  <div class="max-w-6xl mx-auto">

    <div class="text-center mb-8">
      <p class="text-amber-600 text-xs tracking-[0.5em] uppercase mb-4">The Full Experience</p>
      <h2 class="text-5xl md:text-6xl text-stone-800" style="font-family: 'Playfair Display', serif;">
        Everything<br/><em>You Need</em>
      </h2>
    </div>

    <!-- Featured 4 -->
    <div class="grid grid-cols-2 md:grid-cols-4 gap-px bg-stone-200 rounded-2xl overflow-hidden mb-px">
      {#each [
        { name: 'Rooftop Jacuzzi', desc: '6th floor, city views' },
        { name: 'Sunset Bar', desc: 'Cocktails at golden hour' },
        { name: 'Restaurant', desc: 'French & Khmer cuisine' },
        { name: 'Wine Cellar', desc: 'Curated French labels' },
      ] as item}
        <div class="bg-white p-8 hover:bg-amber-50 transition duration-500 group">
          <div class="w-8 h-px bg-amber-500 mb-6 group-hover:w-16 transition-all duration-500"></div>
          <p class="text-stone-800 text-base mb-2" style="font-family: 'Playfair Display', serif;">{item.name}</p>
          <p class="text-stone-400 text-xs font-light tracking-wide">{item.desc}</p>
        </div>
      {/each}
    </div>

    <!-- Secondary grid -->
    <div class="grid grid-cols-2 md:grid-cols-4 gap-px bg-stone-200 rounded-2xl overflow-hidden mt-px">
      {#each [
        { name: 'Spa & Massage', desc: 'In-room available' },
        { name: 'Fitness Center', desc: 'Full equipment' },
        { name: 'Snooker Table', desc: 'Rooftop terrace' },
        { name: 'Bicycle Rental', desc: 'Explore the city' },
        { name: 'Free WiFi', desc: '100+ Mbps' },
        { name: 'Free Parking', desc: 'Secured on-site' },
        { name: 'Pet Friendly', desc: 'All breeds welcome' },
        { name: 'Elevator', desc: 'All floors' },
        { name: '24hr Security', desc: 'CCTV throughout' },
        { name: 'Laundry Service', desc: 'Daily housekeeping' },
        { name: 'Airport Transfer', desc: 'On request' },
        { name: 'Concierge', desc: 'Tours & tickets' },
      ] as item}
        <div class="bg-white p-6 hover:bg-stone-50 transition duration-300 group">
          <div class="w-4 h-px bg-stone-300 mb-4 group-hover:bg-amber-500 group-hover:w-8 transition-all duration-300"></div>
          <p class="text-stone-700 text-sm mb-1">{item.name}</p>
          <p class="text-stone-400 text-xs font-light">{item.desc}</p>
        </div>
      {/each}
    </div>

  </div>
</section>

<!-- LOCATION MAP -->
<section class="pt-8 pb-16 px-8 bg-stone-50">
  <div class="max-w-6xl mx-auto">
    <div class="text-center mb-12">
      <p class="text-amber-600 text-xs tracking-[0.4em] uppercase mb-4">Find Us</p>
      <h2 class="text-4xl text-stone-800 mb-4" style="font-family: 'Playfair Display', serif;">Location</h2>
      <p class="text-stone-500 font-light">Quiet residential street — between the airport and the riverside</p>
    </div>

    <div class="rounded-2xl overflow-hidden shadow-sm mb-8" style="height: 450px;">
      <iframe
        title="La Belle Residence Location"
        width="100%"
        height="100%"
        frameborder="0"
        scrolling="no"
        src="https://www.openstreetmap.org/export/embed.html?bbox=104.90500%2C11.52500%2C104.93500%2C11.55500&layer=mapnik&marker=11.54060%2C104.91800"
        style="border: none;"
      ></iframe>
    </div>

    <div class="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
      {#each [
        { place: 'Russian Market', distance: '5 min' },
        { place: 'Airport', distance: '10 min' },
        { place: 'Royal Palace', distance: '20 min' },
        { place: 'Riverside', distance: '20 min' }
      ] as loc}
        <div class="bg-white rounded-xl p-6 shadow-sm">
          <p class="text-amber-600 text-xl font-light mb-1" style="font-family: 'Playfair Display', serif;">{loc.distance}</p>
          <p class="text-stone-500 text-xs tracking-widest uppercase">{loc.place}</p>
        </div>
      {/each}
    </div>
  </div>
</section>

<!-- TESTIMONIALS -->
<section class="pt-12 pb-24 px-8 bg-stone-100">
  <div class="max-w-6xl mx-auto">
    <div class="text-center mb-12">
      <p class="text-amber-600 text-xs tracking-[0.4em] uppercase mb-3">Guest Reviews</p>
      <h2 class="text-4xl text-stone-800" style="font-family: 'Playfair Display', serif;">What Guests Say</h2>
    </div>
    <div class="grid md:grid-cols-3 gap-8">
      {#each [
        { text: "Clean, spacious and comfortable. Owner and staff were so friendly and helpful. Will book this place again for sure.", author: "Jean", location: "TripAdvisor" },
        { text: "Lovely to have so much space, a kitchen to use and even a washer in the suite. Comfy beds, good AC and lovely staff.", author: "Verified Guest", location: "Booking.com" },
        { text: "Amazing place! I booked for one month. It has everything you need — spacious apartment, excellent staff and all the facilities plus a lot more.", author: "Peter", location: "TripAdvisor" }
      ] as review}
        <div class="bg-white p-8 rounded-2xl shadow-sm">
          <p class="text-amber-500 text-3xl mb-4" style="font-family: 'Playfair Display', serif;">"</p>
          <p class="text-stone-600 font-light leading-relaxed mb-6 italic">{review.text}</p>
          <div class="border-t border-stone-100 pt-4">
            <p class="text-stone-800 text-sm font-medium">{review.author}</p>
            <p class="text-stone-400 text-xs">{review.location}</p>
          </div>
        </div>
      {/each}
    </div>
  </div>
</section>

<!-- EMAIL FORM -->
<section id="enquiry" class="pt-12 pb-24 px-8 bg-white">
  <div class="max-w-2xl mx-auto">
    <div class="text-center mb-8">
      <p class="text-amber-600 text-xs tracking-[0.4em] uppercase mb-3">Direct Enquiry</p>
      <h2 class="text-4xl text-stone-800" style="font-family: 'Playfair Display', serif;">Send Us a Message</h2>
      <p class="text-stone-500 font-light mt-3">We respond within 24 hours</p>
    </div>

    <form onsubmit={handleSubmit} class="space-y-6">
      <div class="grid md:grid-cols-2 gap-6">
        <div>
          <label class="block text-stone-600 text-sm tracking-widest uppercase mb-2">Full Name</label>
          <input
            type="text"
            bind:value={formData.name}
            required
            class="w-full border border-stone-200 rounded-xl px-4 py-3 text-stone-800 text-base font-light focus:outline-none focus:border-amber-400 transition"
            placeholder="Your name"
          />
        </div>
        <div>
          <label class="block text-stone-600 text-sm tracking-widest uppercase mb-2">Email</label>
          <input
            type="email"
            bind:value={formData.email}
            required
            class="w-full border border-stone-200 rounded-xl px-4 py-3 text-stone-800 text-base font-light focus:outline-none focus:border-amber-400 transition"
            placeholder="your@email.com"
          />
        </div>
      </div>

      <div>
        <label class="block text-stone-600 text-sm tracking-widest uppercase mb-2">
          Check In — Check Out
        </label>
        <div class="relative">
          <input
            bind:this={dateInput}
            type="text"
            readonly
            placeholder="Select your dates"
            class="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-4 text-stone-800 text-sm font-light focus:outline-none focus:border-amber-400 transition cursor-pointer"
          />
          <div class="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
            <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 text-stone-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        </div>
      </div>

      <div>
        <label class="block text-stone-600 text-sm tracking-widest uppercase mb-2">Suite Type</label>
        <select
          bind:value={formData.suite}
          class="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-4 text-stone-800 text-base font-light focus:outline-none focus:border-amber-400 focus:bg-white transition appearance-none cursor-pointer"
        >
          <option value="">Select a suite</option>
          <option value="1 Bedroom Suite">1 Bedroom Suite</option>
          <option value="1 Bedroom Superior Suite">1 Bedroom Superior Suite</option>
          <option value="2 Bedroom Suite">2 Bedroom Suite</option>
          <option value="2 Bedroom Superior Suite">2 Bedroom Superior Suite</option>
          <option value="3 Bedroom Suite">3 Bedroom Suite</option>
        </select>
      </div>

      <div>
        <label class="block text-stone-600 text-sm tracking-widest uppercase mb-2">Message</label>
        <textarea
          bind:value={formData.message}
          rows="4"
          class="w-full border border-stone-200 rounded-xl px-4 py-3 text-stone-800 text-base font-light focus:outline-none focus:border-amber-400 transition resize-none"
          placeholder="Any questions or special requests..."
        ></textarea>
      </div>

      {#if formStatus === 'sent'}
        <div class="text-center py-12">
          <div class="w-16 h-16 rounded-full border border-amber-400 flex items-center justify-center mx-auto mb-6">
            <svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h3 class="text-2xl text-stone-800 mb-3" style="font-family: 'Playfair Display', serif;">
            Thank You, {formData.name.split(' ')[0]}
          </h3>
          <p class="text-stone-500 font-light leading-relaxed max-w-sm mx-auto mb-2">
            Your enquiry has been received. We will be in touch within 24 hours.
          </p>
          <p class="text-stone-400 text-sm font-light">
            In the meantime, feel free to reach us directly on WhatsApp.
          </p>
          <a
            href="https://wa.me/85531636123"
            target="_blank"
            class="inline-block mt-8 border border-stone-200 text-stone-500 px-6 py-3 rounded-full text-sm hover:border-amber-400 hover:text-amber-600 transition"
          >
            WhatsApp Us
          </a>
        </div>
      {:else if formStatus === 'error'}
        <div class="text-center py-8">
          <p class="text-red-500 text-sm mb-4">Something went wrong. Please try again or contact us directly.</p>
          <div class="flex gap-4 justify-center">
            <a href="https://wa.me/85531636123" target="_blank" class="border border-stone-200 text-stone-500 px-6 py-3 rounded-full text-sm hover:border-amber-400 hover:text-amber-600 transition">
              WhatsApp
            </a>
            <a href="mailto:reservations@labelleresidence.com" class="border border-stone-200 text-stone-500 px-6 py-3 rounded-full text-sm hover:border-amber-400 hover:text-amber-600 transition">
              Email
            </a>
          </div>
        </div>
      {:else}
        <button
          type="submit"
          disabled={formStatus === 'sending'}
          class="w-full bg-stone-800 hover:bg-amber-700 disabled:opacity-50 text-white py-4 rounded-full text-sm font-medium tracking-wide transition"
        >
          {formStatus === 'sending' ? 'Sending...' : 'Send Enquiry'}
        </button>
      {/if}
    </form>
  </div>
</section>

<!-- CONTACT -->
<section id="contact" class="py-24 px-8 bg-stone-900 text-white text-center">
  <p class="text-amber-400 text-xs tracking-[0.4em] uppercase mb-4">Get In Touch</p>
  <h2 class="text-4xl mb-8" style="font-family: 'Playfair Display', serif;">Book Your Stay</h2>
  <p class="text-white/60 font-light mb-10">Direct bookings always get the best rate — no OTA fees.</p>
  <div class="flex flex-col md:flex-row gap-4 justify-center items-center">
    <a href="https://wa.me/85531636123" target="_blank" class="bg-green-500 hover:bg-green-600 text-white px-8 py-3 rounded-full text-sm font-medium transition">
      WhatsApp Us
    </a>
    <a href="mailto:twb@diogenesgroup.ltd" class="border border-white/30 text-white px-8 py-3 rounded-full text-sm font-light hover:border-white transition">
      Email Us
    </a>
  </div>
  <div class="mt-16 text-white/40 text-sm font-light space-y-2">
    <p>#1491 Street 81BT, Sangkat Boeng Tumpun, Khan Mean Chey</p>
    <p>Phnom Penh, Kingdom of Cambodia</p>
    <p class="mt-4">
      <a href="tel:+85531636123" class="hover:text-white/70 transition">+855 (0)31 636 1237</a>
    </p>
    <p>
      <a href="mailto:reservations@labelleresidence.com" class="hover:text-white/70 transition">
        reservations@labelleresidence.com
      </a>
    </p>

    <!-- SOCIAL ICONS -->
    <div class="flex items-center justify-center gap-6 pt-8">

      <a href="https://www.facebook.com/labelleresidence" target="_blank" rel="noopener noreferrer"
        class="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center text-white/40 hover:text-white hover:border-amber-400 transition duration-300" title="Facebook">
        <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 fill-current" viewBox="0 0 24 24">
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
        </svg>
      </a>

      <a href="https://www.youtube.com/channel/UCXCAhI5BOY6cjiPcRfxZbvw" target="_blank" rel="noopener noreferrer"
        class="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center text-white/40 hover:text-white hover:border-amber-400 transition duration-300" title="YouTube">
        <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 fill-current" viewBox="0 0 24 24">
          <path d="M23.495 6.205a3.007 3.007 0 0 0-2.088-2.088c-1.87-.501-9.396-.501-9.396-.501s-7.507-.01-9.396.501A3.007 3.007 0 0 0 .527 6.205a31.247 31.247 0 0 0-.522 5.805 31.247 31.247 0 0 0 .522 5.783 3.007 3.007 0 0 0 2.088 2.088c1.868.502 9.396.502 9.396.502s7.506 0 9.396-.502a3.007 3.007 0 0 0 2.088-2.088 31.247 31.247 0 0 0 .5-5.783 31.247 31.247 0 0 0-.5-5.805zM9.609 15.601V8.408l6.264 3.602z"/>
        </svg>
      </a>

      <a href="https://www.tripadvisor.com/Hotel_Review-g293940-d10112631-Reviews-La_Belle_Residence-Phnom_Penh.html" target="_blank" rel="noopener noreferrer"
        class="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center text-white/40 hover:text-white hover:border-amber-400 transition duration-300" title="TripAdvisor">
        <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 fill-current" viewBox="0 0 24 24">
          <path d="M12.006 4.295c-2.67 0-5.338.784-7.645 2.353H0l1.963 2.135a5.997 5.997 0 0 0 2.03 8.816A5.997 5.997 0 0 0 12 19.705a5.997 5.997 0 0 0 8.007-2.106 5.997 5.997 0 0 0 2.03-8.816L24 6.648h-4.361a13.891 13.891 0 0 0-7.633-2.353zM12 7.247a4.753 4.753 0 1 1 0 9.506 4.753 4.753 0 0 1 0-9.506zm0 1.908a2.845 2.845 0 1 0 0 5.69 2.845 2.845 0 0 0 0-5.69z"/>
        </svg>
      </a>

      <a href="https://wa.me/85531636123" target="_blank" rel="noopener noreferrer"
        class="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center text-white/40 hover:text-white hover:border-amber-400 transition duration-300" title="WhatsApp">
        <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 fill-current" viewBox="0 0 24 24">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
        </svg>
      </a>

      <a href="https://instagram.com/labelleresidence" target="_blank" rel="noopener noreferrer"
        class="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center text-white/40 hover:text-white hover:border-amber-400 transition duration-300" title="Instagram">
        <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 fill-current" viewBox="0 0 24 24">
          <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
        </svg>
      </a>

      <a href="https://tiktok.com/@labelleresidence" target="_blank" rel="noopener noreferrer"
        class="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center text-white/40 hover:text-white hover:border-amber-400 transition duration-300" title="TikTok">
        <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 fill-current" viewBox="0 0 24 24">
          <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/>
        </svg>
      </a>

    </div>
  </div>
</section>

<!-- FOOTER -->
<footer class="bg-stone-950 py-8 px-8">
  <div class="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
    <p class="text-white/30 text-xs tracking-widest uppercase">La Belle Résidence · Phnom Penh</p>
    <p class="text-white/20 text-xs">© 2026 La Belle Résidence</p>
  </div>
</footer>

<!-- SCROLL TO TOP -->
<button
  onclick={scrollToTop}
  class={`fixed bottom-8 left-6 z-50 w-10 h-10 rounded-full flex items-center justify-center shadow-lg transition-all duration-500 ${
    showScrollTop
      ? 'opacity-100 translate-y-0 bg-stone-700 hover:bg-amber-700'
      : 'opacity-0 translate-y-4 pointer-events-none'
  }`}
  title="Back to top"
>
  <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 15l7-7 7 7" />
  </svg>
</button>

<!-- FLOATING WHATSAPP -->
<a 
  href="https://wa.me/85531636123"
  target="_blank"
  rel="noopener noreferrer"
  class="fixed bottom-6 right-6 z-50 w-14 h-14 bg-green-500 hover:bg-green-600 rounded-full flex items-center justify-center shadow-lg transition"
  title="WhatsApp"
>
  <svg xmlns="http://www.w3.org/2000/svg" class="w-7 h-7 fill-white" viewBox="0 0 24 24">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
  </svg>
</a>