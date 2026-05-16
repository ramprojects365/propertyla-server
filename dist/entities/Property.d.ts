import { User } from './User.js';
export interface PropertyImage {
    url: string;
    fileName?: string;
    order?: number;
    category?: string;
    customPlaceName?: string;
    displayPlace?: string;
    caption?: string;
    isCover?: boolean;
}
export declare class Property {
    id: string;
    title: string;
    description: string;
    listingType: 'rent' | 'sale';
    propertyType: string;
    tenure: 'freehold' | 'leasehold';
    propertyName?: string;
    streetName?: string;
    cityName?: string;
    state?: string;
    county?: string;
    pincode?: string;
    landmark?: string;
    location?: string;
    latitude?: number;
    longitude?: number;
    price: number;
    buildupArea?: number;
    furnishing?: 'Fully' | 'Partially' | 'Unfurnished';
    bedrooms?: number;
    bathrooms?: number;
    availability?: 'Immediate' | 'Next month' | 'Under Construction';
    floorLevel?: string;
    yearOfBuild?: number;
    negotiable: boolean;
    amenities: {
        lifestyle: string[];
        facilities: string[];
        security: string[];
    };
    images?: Array<string | PropertyImage>;
    floorPlan?: string;
    status: string;
    userId: string;
    user: User;
    createdAt: Date;
    updatedAt: Date;
}
//# sourceMappingURL=Property.d.ts.map