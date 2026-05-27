import { Property } from '../entities/Property.js';
type AdvisorAnswers = {
    intent?: 'rent' | 'buy' | '';
    location?: string;
    budgetRange?: string;
    budgetAmount?: string | number;
    bedrooms?: string;
};
type AdvisorContact = {
    name?: string;
    phone?: string;
    email?: string;
};
type PropertyFitRequest = {
    answers?: AdvisorAnswers;
    contact?: AdvisorContact;
};
type PropertyViewRequest = {
    propertyId?: string;
    contact?: AdvisorContact;
    propertyUrl?: string;
};
export declare const getPropertyFitMatches: (request: PropertyFitRequest) => Promise<{
    autoRegistered: boolean;
    autoLoggedIn: boolean;
    fallbackUsed: boolean;
    exactMatchCount: number;
    auth: {
        token: string;
        user: {
            id: string;
            username: string;
            email: string;
            phoneNumber: string | null;
            userType: string | null;
            fullName: string;
            emailVerified: boolean;
        };
    } | null;
    leadUserId: string | undefined;
    count: number;
    data: Property[];
}>;
export declare const notifyPropertyViewed: (request: PropertyViewRequest) => Promise<{
    notified: boolean;
    message: string;
} | {
    notified: boolean;
    message?: undefined;
}>;
export declare const createOrLoginPropertyFitLead: (contact?: AdvisorContact) => Promise<{
    autoRegistered: boolean;
    autoLoggedIn: boolean;
    auth: {
        token: string;
        user: {
            id: string;
            username: string;
            email: string;
            phoneNumber: string | null;
            userType: string | null;
            fullName: string;
            emailVerified: boolean;
        };
    };
}>;
export {};
//# sourceMappingURL=propertyFitService.d.ts.map