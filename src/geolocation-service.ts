// import { LocationData, GeolocationProvider } from './location-types';

// /**
//  * GeoIP Lite Provider (offline, free)
//  */
// export class GeoIPLiteProvider implements GeolocationProvider {
//   private geoip: any;

//   constructor() {
//     try {
//       this.geoip = require('geoip-lite');
//     } catch (error) {
//       console.warn('geoip-lite not installed. Install with: npm install geoip-lite @types/geoip-lite');
//     }
//   }

//   async getLocation(ip: string): Promise<LocationData> {
//     if (!this.geoip) {
//       throw new Error('geoip-lite not available');
//     }

//     const geo = this.geoip.lookup(ip);
//     if (!geo) {
//       throw new Error(`Unable to determine location for IP: ${ip}`);
//     }

//     return {
//       ip,
//       country: geo.country || 'Unknown',
//       countryCode: geo.country || 'XX',
//       region: geo.region || 'Unknown',
//       regionCode: geo.region || 'XX',
//       city: geo.city || 'Unknown',
//       latitude: geo.ll?.[0] || 0,
//       longitude: geo.ll?.[1] || 0,
//       timezone: geo.timezone || 'UTC',
//       timestamp: Date.now(),
//       accuracy: 50 // Rough accuracy for free service
//     };
//   }
// }

// /**
//  * IPData.co Provider (online, requires API key)
//  */
// export class IPDataProvider implements GeolocationProvider {
//   private apiKey: string;
//   private baseUrl = 'https://api.ipdata.co';

//   constructor(apiKey: string) {
//     this.apiKey = apiKey;
//   }

//   async getLocation(ip: string): Promise<LocationData> {
//     const response = await fetch(`${this.baseUrl}/${ip}?api-key=${this.apiKey}`);

//     if (!response.ok) {
//       throw new Error(`IPData API error: ${response.status} ${response.statusText}`);
//     }

//     const data = await response.json();

//     return {
//       ip,
//       country: data.country_name || 'Unknown',
//       countryCode: data.country_code || 'XX',
//       region: data.region || 'Unknown',
//       regionCode: data.region_code || 'XX',
//       city: data.city || 'Unknown',
//       latitude: data.latitude || 0,
//       longitude: data.longitude || 0,
//       timezone: data.time_zone?.name || 'UTC',
//       isp: data.asn?.name,
//       organization: data.organisation,
//       timestamp: Date.now(),
//       accuracy: 5 // High accuracy for paid service
//     };
//   }
// }

// /**
//  * IPInfo.io Provider (online, requires API key)
//  */
// export class IPInfoProvider implements GeolocationProvider {
//   private apiKey: string;
//   private baseUrl = 'https://ipinfo.io';

//   constructor(apiKey: string) {
//     this.apiKey = apiKey;
//   }

//   async getLocation(ip: string): Promise<LocationData> {
//     const response = await fetch(`${this.baseUrl}/${ip}?token=${this.apiKey}`);

//     if (!response.ok) {
//       throw new Error(`IPInfo API error: ${response.status} ${response.statusText}`);
//     }

//     const data = await response.json();

//     // Parse coordinates from loc string (format: "lat,lng")
//     const [lat, lng] = data.loc ? data.loc.split(',').map(Number) : [0, 0];

//     return {
//       ip,
//       country: data.country || 'Unknown',
//       countryCode: data.country || 'XX',
//       region: data.region || 'Unknown',
//       regionCode: data.region || 'XX',
//       city: data.city || 'Unknown',
//       latitude: lat,
//       longitude: lng,
//       timezone: data.timezone || 'UTC',
//       isp: data.org,
//       organization: data.org,
//       timestamp: Date.now(),
//       accuracy: 10 // Good accuracy for IPInfo
//     };
//   }
// }

// /**
//  * IP-API Provider (online, free with rate limits)
//  */
// export class IPAPIProvider implements GeolocationProvider {
//   private baseUrl = 'http://ip-api.com/json';

//   async getLocation(ip: string): Promise<LocationData> {
//     const response = await fetch(`${this.baseUrl}/${ip}`);

//     if (!response.ok) {
//       throw new Error(`IP-API error: ${response.status} ${response.statusText}`);
//     }

//     const data = await response.json();

//     if (data.status === 'fail') {
//       throw new Error(`IP-API error: ${data.message}`);
//     }

//     return {
//       ip,
//       country: data.country || 'Unknown',
//       countryCode: data.countryCode || 'XX',
//       region: data.regionName || 'Unknown',
//       regionCode: data.region || 'XX',
//       city: data.city || 'Unknown',
//       latitude: data.lat || 0,
//       longitude: data.lon || 0,
//       timezone: data.timezone || 'UTC',
//       isp: data.isp,
//       organization: data.org,
//       timestamp: Date.now(),
//       accuracy: 15 // Moderate accuracy for free service
//     };
//   }
// }

// /**
//  * Geolocation Service Factory
//  */
// export class GeolocationService {
//   private provider: GeolocationProvider;

//   constructor(providerType: 'geoip-lite' | 'ipdata' | 'ipinfo' | 'ipapi', apiKey?: string) {
//     switch (providerType) {
//       case 'geoip-lite':
//         this.provider = new GeoIPLiteProvider();
//         break;
//       case 'ipdata':
//         if (!apiKey) throw new Error('API key required for IPData provider');
//         this.provider = new IPDataProvider(apiKey);
//         break;
//       case 'ipinfo':
//         if (!apiKey) throw new Error('API key required for IPInfo provider');
//         this.provider = new IPInfoProvider(apiKey);
//         break;
//       case 'ipapi':
//         this.provider = new IPAPIProvider();
//         break;
//       default:
//         throw new Error(`Unsupported geolocation provider: ${providerType}`);
//     }
//   }

//   async getLocation(ip: string): Promise<LocationData> {
//     try {
//       return await this.provider.getLocation(ip);
//     } catch (error) {
//       console.error(`Geolocation error for IP ${ip}:`, error);
//       throw error;
//     }
//   }

//   /**
//    * Get location with fallback providers
//    */
//   async getLocationWithFallback(ip: string, fallbackProviders: GeolocationProvider[] = []): Promise<LocationData> {
//     try {
//       return await this.provider.getLocation(ip);
//     } catch (error) {
//       console.warn(`Primary geolocation provider failed for IP ${ip}, trying fallbacks...`);

//       for (const fallbackProvider of fallbackProviders) {
//         try {
//           return await fallbackProvider.getLocation(ip);
//         } catch (fallbackError) {
//           console.warn(`Fallback provider failed:`, fallbackError);
//         }
//       }

//       throw new Error(`All geolocation providers failed for IP ${ip}`);
//     }
//   }
// }

// export default GeolocationService;

