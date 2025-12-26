import { NextResponse } from 'next/server';

interface Contact {
  name: string;
  email: string;
  phone: string;
  website: string;
  country: string;
  type: string;
  status: string;
}

// Simulated search function that would normally scrape the web
async function searchChessCoaches(countries: string[]): Promise<Contact[]> {
  const contacts: Contact[] = [];

  // Common chess academies and coaches keywords for search
  const searchTerms = [
    'chess academy',
    'chess coaching',
    'chess school',
    'chess instructor',
    'chess club',
    'chess training',
    'chess lessons'
  ];

  // For demo purposes, generate some realistic sample data
  // In production, this would use web scraping, Google Custom Search API, or other methods
  const sampleNames = [
    'Elite Chess Academy', 'Chess Masters Institute', 'Royal Chess Club',
    'Strategic Chess Training', 'Grand Master Coaching', 'Chess Excellence Center',
    'Advanced Chess School', 'Youth Chess Academy', 'Professional Chess Training',
    'Chess Champions Institute'
  ];

  const domains = ['academy', 'chess', 'coaching', 'training', 'school', 'club'];
  const tlds = ['.com', '.org', '.net', '.edu'];

  for (const country of countries) {
    // Generate 5-10 contacts per country
    const numContacts = Math.floor(Math.random() * 6) + 5;

    for (let i = 0; i < numContacts; i++) {
      const name = sampleNames[Math.floor(Math.random() * sampleNames.length)];
      const domain = domains[Math.floor(Math.random() * domains.length)];
      const tld = tlds[Math.floor(Math.random() * tlds.length)];
      const emailDomain = name.toLowerCase().replace(/\s+/g, '') + tld;

      contacts.push({
        name: `${name} - ${country}`,
        email: `info@${name.toLowerCase().replace(/\s+/g, '')}${tld}`,
        phone: `+${Math.floor(Math.random() * 900) + 100}-${Math.floor(Math.random() * 9000000) + 1000000}`,
        website: `https://www.${name.toLowerCase().replace(/\s+/g, '')}${tld}`,
        country: country.trim(),
        type: Math.random() > 0.5 ? 'Academy' : 'Coach',
        status: 'pending'
      });
    }
  }

  return contacts;
}

export async function POST(request: Request) {
  try {
    const { countries } = await request.json();

    if (!countries || typeof countries !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Countries parameter is required' },
        { status: 400 }
      );
    }

    const countryList = countries.split(',').map(c => c.trim()).filter(c => c);

    if (countryList.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Please provide at least one country' },
        { status: 400 }
      );
    }

    // Simulate search with delay
    await new Promise(resolve => setTimeout(resolve, 2000));

    const contacts = await searchChessCoaches(countryList);

    return NextResponse.json({
      success: true,
      contacts,
      message: `Found ${contacts.length} contacts across ${countryList.length} countries`
    });
  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json(
      { success: false, error: 'Search failed' },
      { status: 500 }
    );
  }
}
