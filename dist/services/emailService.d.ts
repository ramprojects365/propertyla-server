export declare const sendOtpEmail: (to: string, username: string, otp: string) => Promise<void>;
type PropertyFitEmailItem = {
    title: string;
    price?: number | string;
    location?: string;
    url?: string;
    imageUrl?: string;
};
export declare const sendPropertyFitListEmail: (to: string, name: string, properties: PropertyFitEmailItem[]) => Promise<void>;
export declare const sendPropertyViewNotificationEmail: (params: {
    to: string;
    agentName?: string | null;
    leadName?: string;
    leadEmail?: string;
    leadPhone?: string;
    propertyTitle: string;
    propertyUrl?: string;
}) => Promise<void>;
export {};
//# sourceMappingURL=emailService.d.ts.map