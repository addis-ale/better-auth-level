import type { 
  LocationData, 
  GeolocationResponse, 
  LocationAnomaly, 
  UserLocationHistory, 
  NetworkAnalysis,
  MonitorOptions 
} from "./types";

/**
 * Comprehensive Location Detection Service
 * 
 * Implements all definitions of unusual location concepts:
 * - Impossible travel detection
 * - New country/city detection
 * - VPN/Proxy/Tor detection
 * - Suspicious country detection
 * - Timezone anomaly detection
 * - Geographic distance analysis
 */

export class LocationDetectionService {
  private config: Required<MonitorOptions>;
  private userLocationHistory = new Map<string, UserLocationHistory>();
  private suspiciousCountries: Set<string>;
  private vpnProviders: Set<string>;
  private torExitNodes: Set<string>;

  constructor(config: MonitorOptions) {
    this.config = {
      maxNormalDistance: 1000,
      locationAnomalyWindow: 24,
      minLocationHistory: 3,
      enableVpnDetection: true,
      enableTorDetection: true,
      enableSuspiciousCountryDetection: true,
      suspiciousCountries: ['KP', 'IR', 'SY', 'CU', 'VE', 'MM', 'BY', 'RU', 'CN'],
      enableImpossibleTravelDetection: true,
      maxTravelSpeed: 900, // km/h (commercial aircraft speed)
      enableNewCountryDetection: true,
      enableNewCityDetection: false,
      enableTimezoneAnomalyDetection: true,
      ...config
    } as Required<MonitorOptions>;

    this.suspiciousCountries = new Set(this.config.suspiciousCountries);
    this.vpnProviders = new Set([
      'nordvpn', 'expressvpn', 'surfshark', 'cyberghost', 'private internet access',
      'protonvpn', 'windscribe', 'tunnelbear', 'ipvanish', 'hotspot shield',
      'vyprvpn', 'purevpn', 'zenmate', 'hidemyass', 'buffered'
    ]);
    this.torExitNodes = new Set(); // Would be populated from Tor directory
  }

  /**
   * Get geolocation data for an IP address
   */
  async getLocationData(ip: string): Promise<LocationData | null> {
    try {
      // Use multiple geolocation services for accuracy
      const responses = await Promise.allSettled([
        this.fetchFromIpApi(ip),
        this.fetchFromIpInfo(ip),
        this.fetchFromIpGeolocation(ip)
      ]);

      // Use the first successful response
      for (const response of responses) {
        if (response.status === 'fulfilled' && response.value) {
          const locationData = response.value;
          
          // Enhance with VPN/Proxy detection
          const networkAnalysis = await this.analyzeNetwork(ip, locationData);
          
          return {
            ...locationData,
            isVpn: networkAnalysis.isVpn,
            isTor: networkAnalysis.isTor,
            isProxy: networkAnalysis.isProxy,
            riskScore: this.calculateRiskScore(locationData, networkAnalysis)
          };
        }
      }

      return null;
    } catch (error) {
      console.error('Error fetching location data:', error);
      return null;
    }
  }

  /**
   * Detect location anomalies for a user
   */
  async detectLocationAnomalies(
    userId: string, 
    currentLocation: LocationData
  ): Promise<LocationAnomaly[]> {
    const anomalies: LocationAnomaly[] = [];
    const userHistory = this.getUserLocationHistory(userId);

    // Add current location to history
    this.updateUserLocationHistory(userId, currentLocation);

    // Check for various types of anomalies
    if (this.config.enableVpnDetection && currentLocation.isVpn) {
      anomalies.push(this.createVpnAnomaly(currentLocation));
    }

    if (this.config.enableTorDetection && currentLocation.isTor) {
      anomalies.push(this.createTorAnomaly(currentLocation));
    }

    if (this.config.enableSuspiciousCountryDetection && 
        this.suspiciousCountries.has(currentLocation.countryCode)) {
      anomalies.push(this.createSuspiciousCountryAnomaly(currentLocation));
    }

    if (userHistory.locations.length >= this.config.minLocationHistory) {
      const previousLocation = this.getLastLocation(userHistory);
      
      if (previousLocation) {
        // Impossible travel detection
        if (this.config.enableImpossibleTravelDetection) {
          const impossibleTravel = this.detectImpossibleTravel(
            previousLocation, 
            currentLocation
          );
          if (impossibleTravel) anomalies.push(impossibleTravel);
        }

        // New country detection
        if (this.config.enableNewCountryDetection) {
          const newCountry = this.detectNewCountry(userHistory, currentLocation);
          if (newCountry) anomalies.push(newCountry);
        }

        // New city detection
        if (this.config.enableNewCityDetection) {
          const newCity = this.detectNewCity(userHistory, currentLocation);
          if (newCity) anomalies.push(newCity);
        }

        // Timezone anomaly detection
        if (this.config.enableTimezoneAnomalyDetection) {
          const timezoneAnomaly = this.detectTimezoneAnomaly(
            previousLocation, 
            currentLocation
          );
          if (timezoneAnomaly) anomalies.push(timezoneAnomaly);
        }
      }
    }

    return anomalies;
  }

  /**
   * Get user location history
   */
  private getUserLocationHistory(userId: string): UserLocationHistory {
    if (!this.userLocationHistory.has(userId)) {
      this.userLocationHistory.set(userId, {
        userId,
        locations: [],
        lastUpdated: Date.now(),
        frequentLocations: [],
        suspiciousLocations: []
      });
    }
    return this.userLocationHistory.get(userId)!;
  }

  /**
   * Update user location history
   */
  private updateUserLocationHistory(userId: string, location: LocationData): void {
    const history = this.getUserLocationHistory(userId);
    
    // Add new location
    history.locations.push(location);
    
    // Keep only recent locations (within anomaly window)
    const cutoffTime = Date.now() - (this.config.locationAnomalyWindow * 60 * 60 * 1000);
    history.locations = history.locations.filter(loc => loc.timestamp > cutoffTime);
    
    // Update frequent locations
    this.updateFrequentLocations(history);
    
    history.lastUpdated = Date.now();
  }

  /**
   * Calculate distance between two coordinates using Haversine formula
   */
  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.toRadians(lat2 - lat1);
    const dLon = this.toRadians(lon2 - lon1);
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  /**
   * Detect impossible travel between two locations
   */
  private detectImpossibleTravel(
    previous: LocationData, 
    current: LocationData
  ): LocationAnomaly | null {
    const distance = this.calculateDistance(
      previous.latitude, 
      previous.longitude, 
      current.latitude, 
      current.longitude
    );
    
    const timeDiff = (current.timestamp - previous.timestamp) / (1000 * 60 * 60); // hours
    const speed = distance / timeDiff; // km/h

    if (speed > this.config.maxTravelSpeed && timeDiff > 0.5) { // At least 30 minutes
      return {
        type: 'impossible_travel',
        severity: speed > 2000 ? 'critical' : 'high',
        confidence: Math.min(0.9, speed / this.config.maxTravelSpeed),
        description: `Impossible travel detected: ${distance.toFixed(1)}km in ${timeDiff.toFixed(1)}h (${speed.toFixed(1)} km/h)`,
        riskScore: Math.min(100, (speed / this.config.maxTravelSpeed) * 100),
        metadata: {
          distance,
          timeDiff,
          speed,
          previousLocation: previous,
          currentLocation: current
        }
      };
    }

    return null;
  }

  /**
   * Detect new country login
   */
  private detectNewCountry(history: UserLocationHistory, current: LocationData): LocationAnomaly | null {
    const hasVisitedCountry = history.locations.some(loc => 
      loc.countryCode === current.countryCode && 
      loc.timestamp > current.timestamp - (24 * 60 * 60 * 1000) // Last 24 hours
    );

    if (!hasVisitedCountry) {
      return {
        type: 'new_country',
        severity: 'medium',
        confidence: 0.8,
        description: `New country detected: ${current.country}`,
        riskScore: 60,
        metadata: {
          country: current.country,
          countryCode: current.countryCode,
          previousCountries: [...new Set(history.locations.map(loc => loc.countryCode))]
        }
      };
    }

    return null;
  }

  /**
   * Detect new city login
   */
  private detectNewCity(history: UserLocationHistory, current: LocationData): LocationAnomaly | null {
    const hasVisitedCity = history.locations.some(loc => 
      loc.city === current.city && 
      loc.countryCode === current.countryCode &&
      loc.timestamp > current.timestamp - (24 * 60 * 60 * 1000)
    );

    if (!hasVisitedCity) {
      return {
        type: 'new_city',
        severity: 'low',
        confidence: 0.7,
        description: `New city detected: ${current.city}, ${current.country}`,
        riskScore: 30,
        metadata: {
          city: current.city,
          country: current.country,
          previousCities: [...new Set(history.locations.map(loc => `${loc.city}, ${loc.countryCode}`))]
        }
      };
    }

    return null;
  }

  /**
   * Detect timezone anomalies
   */
  private detectTimezoneAnomaly(
    previous: LocationData, 
    current: LocationData
  ): LocationAnomaly | null {
    if (previous.timezone === current.timezone) return null;

    const timeDiff = (current.timestamp - previous.timestamp) / (1000 * 60 * 60); // hours
    const timezoneDiff = this.getTimezoneDifference(previous.timezone, current.timezone);

    // Check if timezone change is consistent with travel time
    if (Math.abs(timeDiff - timezoneDiff) > 2) { // More than 2 hours difference
      return {
        type: 'timezone_anomaly',
        severity: 'medium',
        confidence: 0.7,
        description: `Timezone anomaly: ${previous.timezone} to ${current.timezone} in ${timeDiff.toFixed(1)}h`,
        riskScore: 50,
        metadata: {
          previousTimezone: previous.timezone,
          currentTimezone: current.timezone,
          timeDiff,
          timezoneDiff
        }
      };
    }

    return null;
  }

  /**
   * Analyze network for VPN/Proxy/Tor detection
   */
  private async analyzeNetwork(ip: string, location: LocationData): Promise<NetworkAnalysis> {
    const isp = location.isp?.toLowerCase() || '';
    const org = location.org?.toLowerCase() || '';
    
    // Check for VPN providers
    const isVpn = this.vpnProviders.has(isp) || 
                  this.vpnProviders.has(org) ||
                  isp.includes('vpn') ||
                  org.includes('vpn');

    // Check for Tor exit nodes
    const isTor = this.torExitNodes.has(ip) || 
                  isp.includes('tor') ||
                  org.includes('tor');

    // Check for proxy indicators
    const isProxy = isp.includes('proxy') ||
                   org.includes('proxy') ||
                   isp.includes('hosting') ||
                   org.includes('hosting');

    const confidence = isVpn ? 0.9 : isTor ? 0.8 : isProxy ? 0.6 : 0.1;
    const riskLevel = isVpn || isTor ? 'high' : isProxy ? 'medium' : 'low';

    return {
      isVpn,
      isTor,
      isProxy,
      confidence,
      riskLevel,
      provider: isVpn ? isp : undefined,
      serverLocation: isVpn ? location.city : undefined
    };
  }

  /**
   * Calculate risk score for a location
   */
  private calculateRiskScore(location: LocationData, network: NetworkAnalysis): number {
    let score = 0;

    // Base score for suspicious countries
    if (this.suspiciousCountries.has(location.countryCode)) {
      score += 40;
    }

    // VPN/Proxy/Tor detection
    if (network.isVpn) score += 30;
    if (network.isTor) score += 50;
    if (network.isProxy) score += 20;

    // ISP/Organization analysis
    if (location.isp?.includes('hosting')) score += 15;
    if (location.org?.includes('hosting')) score += 15;

    return Math.min(100, score);
  }

  /**
   * Create VPN detection anomaly
   */
  private createVpnAnomaly(location: LocationData): LocationAnomaly {
    return {
      type: 'vpn_detected',
      severity: 'medium',
      confidence: 0.9,
      description: `VPN detected: ${location.isp}`,
      riskScore: 70,
      metadata: {
        isp: location.isp,
        org: location.org,
        location: location
      }
    };
  }

  /**
   * Create Tor detection anomaly
   */
  private createTorAnomaly(location: LocationData): LocationAnomaly {
    return {
      type: 'tor_detected',
      severity: 'high',
      confidence: 0.9,
      description: `Tor network detected: ${location.isp}`,
      riskScore: 85,
      metadata: {
        isp: location.isp,
        org: location.org,
        location: location
      }
    };
  }

  /**
   * Create suspicious country anomaly
   */
  private createSuspiciousCountryAnomaly(location: LocationData): LocationAnomaly {
    return {
      type: 'suspicious_country',
      severity: 'high',
      confidence: 0.8,
      description: `Suspicious country detected: ${location.country}`,
      riskScore: 80,
      metadata: {
        country: location.country,
        countryCode: location.countryCode,
        location: location
      }
    };
  }

  /**
   * Get last location from user history
   */
  private getLastLocation(history: UserLocationHistory): LocationData | null {
    return history.locations.length > 0 
      ? history.locations[history.locations.length - 1] 
      : null;
  }

  /**
   * Update frequent locations for a user
   */
  private updateFrequentLocations(history: UserLocationHistory): void {
    const locationCounts = new Map<string, { location: LocationData; count: number }>();
    
    history.locations.forEach(loc => {
      const key = `${loc.city}, ${loc.countryCode}`;
      const existing = locationCounts.get(key);
      if (existing) {
        existing.count++;
      } else {
        locationCounts.set(key, { location: loc, count: 1 });
      }
    });

    history.frequentLocations = Array.from(locationCounts.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)
      .map(item => item.location);
  }

  /**
   * Get timezone difference in hours
   */
  private getTimezoneDifference(tz1: string, tz2: string): number {
    // Simplified timezone difference calculation
    // In a real implementation, you'd use a proper timezone library
    const tz1Offset = this.getTimezoneOffset(tz1);
    const tz2Offset = this.getTimezoneOffset(tz2);
    return Math.abs(tz1Offset - tz2Offset);
  }

  private getTimezoneOffset(timezone: string): number {
    // Simplified timezone offset calculation
    // In a real implementation, you'd use a proper timezone library like moment-timezone
    const offsets: Record<string, number> = {
      'UTC': 0,
      'GMT': 0,
      'EST': -5,
      'PST': -8,
      'CET': 1,
      'JST': 9,
      // Add more timezones as needed
    };
    
    return offsets[timezone] || 0;
  }

  // Geolocation API implementations
  private async fetchFromIpApi(ip: string): Promise<LocationData | null> {
    try {
      const response = await fetch(`http://ip-api.com/json/${ip}?fields=status,country,countryCode,region,regionName,city,zip,lat,lon,timezone,isp,org,as,query`);
      const data = await response.json();
      
      if (data.status === 'success') {
        return {
          ip: data.query,
          country: data.country,
          countryCode: data.countryCode,
          region: data.region,
          regionName: data.regionName,
          city: data.city,
          zip: data.zip,
          latitude: data.lat,
          longitude: data.lon,
          timezone: data.timezone,
          isp: data.isp,
          org: data.org,
          as: data.as,
          query: data.query,
          timestamp: Date.now()
        };
      }
    } catch (error) {
      console.error('Error fetching from ip-api:', error);
    }
    return null;
  }

  private async fetchFromIpInfo(ip: string): Promise<LocationData | null> {
    try {
      // This would require an API key in a real implementation
      const response = await fetch(`https://ipinfo.io/${ip}/json`);
      const data = await response.json();
      
      if (data.country) {
        const [lat, lon] = data.loc?.split(',').map(Number) || [0, 0];
        return {
          ip: data.ip,
          country: data.country,
          countryCode: data.country,
          region: data.region,
          regionName: data.region,
          city: data.city,
          zip: data.postal,
          latitude: lat,
          longitude: lon,
          timezone: data.timezone,
          isp: data.org,
          org: data.org,
          as: data.org,
          query: data.ip,
          timestamp: Date.now()
        };
      }
    } catch (error) {
      console.error('Error fetching from ipinfo:', error);
    }
    return null;
  }

  private async fetchFromIpGeolocation(ip: string): Promise<LocationData | null> {
    try {
      const response = await fetch(`https://ipgeolocation.io/ip-location/${ip}`);
      const data = await response.json();
      
      if (data.country_name) {
        return {
          ip: data.ip,
          country: data.country_name,
          countryCode: data.country_code2,
          region: data.state_prov,
          regionName: data.state_prov,
          city: data.city,
          zip: data.zipcode,
          latitude: parseFloat(data.latitude),
          longitude: parseFloat(data.longitude),
          timezone: data.time_zone?.name || 'UTC',
          isp: data.isp,
          org: data.organization,
          as: data.organization,
          query: data.ip,
          timestamp: Date.now()
        };
      }
    } catch (error) {
      console.error('Error fetching from ipgeolocation:', error);
    }
    return null;
  }
}
