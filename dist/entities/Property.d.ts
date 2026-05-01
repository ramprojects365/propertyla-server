import { User } from './User.js';
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
    images?: string[];
    status: string;
    userId: string;
    user: User;
    createdAt: Date;
    updatedAt: Date;
}
//# sourceMappingURL=Property.d.ts.map