'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { toast } from "@/components/ui/toast"
import { ArrowLeft, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

// ============================================================
// ZOD SCHEMA
// ============================================================
const businessHoursSchema = z.object({
    isOpen: z.boolean().default(true),
    open: z.string().optional(),
    close: z.string().optional(),
});

const restaurantKnowledgeSchema = z.object({
    businessIdentity: z.string().min(10, 'Business identity is required').max(2000),
    foodVariety: z.string().min(10, 'Food variety information is required').max(4000),
    deliveryInformation: z.string().min(10, 'Delivery information is required').max(2000),
    paymentInformation: z.string().min(10, 'Payment information is required').max(1000),
    reservationInformation: z.string().min(10, 'Reservation information is required').max(1000),
    businessHours: z.object({
        monday: businessHoursSchema,
        tuesday: businessHoursSchema,
        wednesday: businessHoursSchema,
        thursday: businessHoursSchema,
        friday: businessHoursSchema,
        saturday: businessHoursSchema,
        sunday: businessHoursSchema,
    }),
});

// ============================================================
// DAYS OF WEEK
// ============================================================
const DAYS = [
    { key: 'monday', label: 'Monday' },
    { key: 'tuesday', label: 'Tuesday' },
    { key: 'wednesday', label: 'Wednesday' },
    { key: 'thursday', label: 'Thursday' },
    { key: 'friday', label: 'Friday' },
    { key: 'saturday', label: 'Saturday' },
    { key: 'sunday', label: 'Sunday' },
];

const LANGUAGE_OPTIONS = [
    { id: 'english', label: 'English' },
    { id: 'urdu', label: 'Urdu' },
];

// ============================================================
// COMPONENTS
// ============================================================
const BusinessHoursSection = ({ register, watch, setValue }) => {
    return (
        <div className="space-y-4">
            <div className="space-y-2">
                <h4 className="text-sm font-medium">Weekly Schedule</h4>
                <p className="text-sm text-muted-foreground max-w-lg">
                    These hours describe when your business is operating. TeleAgent remains available 24/7.
                </p>
            </div>
            <div className="space-y-3">
                {DAYS.map((day) => {
                    const isOpen = watch(`data.businessHours.${day.key}.isOpen`);
                    return (
                        <div key={day.key} className="flex items-center gap-4 flex-wrap">
                            <div className="w-24 text-sm font-medium">{day.label}</div>
                            <div className="flex items-center gap-3">
                                <Switch
                                    checked={isOpen}
                                    onCheckedChange={(checked) => {
                                        setValue(`data.businessHours.${day.key}.isOpen`, checked);
                                    }}
                                />
                                <span className="text-sm text-muted-foreground">
                                    {isOpen ? 'Open' : 'Closed'}
                                </span>
                            </div>
                            {isOpen && (
                                <div className="flex items-center gap-2">
                                    <Input
                                        type="time"
                                        className="w-28 h-9 text-sm"
                                        {...register(`data.businessHours.${day.key}.open`)}
                                    />
                                    <span className="text-sm text-muted-foreground">to</span>
                                    <Input
                                        type="time"
                                        className="w-28 h-9 text-sm"
                                        {...register(`data.businessHours.${day.key}.close`)}
                                    />
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

const KnowledgeTextarea = ({
    label,
    description,
    placeholder,
    register,
    name,
    maxLength,
    error,
    required = true
}) => {
    const [value, setValue] = useState('');

    return (
        <div className="space-y-2">
            <div className="flex items-center gap-1">
                <Label htmlFor={name} className="text-sm font-medium">
                    {label} {required && <span className="text-destructive">*</span>}
                </Label>
            </div>
            <p className="text-sm text-muted-foreground max-w-lg">
                {description}
            </p>
            <Textarea
                id={name}
                placeholder={placeholder}
                className="min-h-35 max-h-65 resize-none overflow-y-auto"
                maxLength={maxLength}
                {...register(name)}
                onChange={(e) => setValue(e.target.value)}
                aria-invalid={error ? "true" : "false"}
            />
            <div className="flex justify-between items-center">
                {error && (
                    <p className="text-sm text-destructive">
                        {error.message}
                    </p>
                )}
                <span className={cn(
                    "text-sm ml-auto",
                    value.length > maxLength * 0.9 ? "text-orange-500" : "text-muted-foreground"
                )}>
                    {value.length} / {maxLength}
                </span>
            </div>
        </div>
    );
};

const CheckboxGroup = ({ options, selected, onChange, label }) => {
    return (
        <div className="space-y-2">
            <Label className="text-sm font-medium">{label} <span className="text-destructive">*</span></Label>
            <div className="flex gap-4">
                {options.map((option) => (
                    <div key={option.id} className="flex items-center gap-2">
                        <Checkbox
                            id={option.id}
                            checked={selected.includes(option.id)}
                            onCheckedChange={(checked) => {
                                if (checked) {
                                    onChange([...selected, option.id]);
                                } else {
                                    onChange(selected.filter((id) => id !== option.id));
                                }
                            }}
                        />
                        <Label htmlFor={option.id} className="text-sm font-normal cursor-pointer">
                            {option.label}
                        </Label>
                    </div>
                ))}
            </div>
        </div>
    );
};

// ============================================================
// MAIN PAGE
// ============================================================
const BusinessKnowledgePage = () => {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const getDefaultValues = () => {
        const hours = {
            monday: { isOpen: true, open: '09:00', close: '18:00' },
            tuesday: { isOpen: true, open: '09:00', close: '18:00' },
            wednesday: { isOpen: true, open: '09:00', close: '18:00' },
            thursday: { isOpen: true, open: '09:00', close: '18:00' },
            friday: { isOpen: true, open: '09:00', close: '18:00' },
            saturday: { isOpen: false, open: '09:00', close: '18:00' },
            sunday: { isOpen: false, open: '09:00', close: '18:00' },
        };

        return {
            data: {
                businessIdentity: '',
                foodVariety: '',
                deliveryInformation: '',
                paymentInformation: '',
                reservationInformation: '',
                businessHours: hours,
            }
        };
    };

    const getSchema = () => {
        return zodResolver(
            z.object({
                data: restaurantKnowledgeSchema
            })
        );
    };

    const {
        register,
        handleSubmit,
        watch,
        setValue,
        formState: { errors },
    } = useForm({
        resolver: getSchema(),
        defaultValues: getDefaultValues(),
    });

    useEffect(() => {
        setIsLoading(false);
    }, []);

    const onSubmit = async (values) => {
        setIsSubmitting(true);
        try {
            const payload = {
                businessType: 'RESTAURANT',
                ...values,
            };
            // Simulate API call
            await new Promise((resolve) => setTimeout(resolve, 1500));

            // Correct way to use your custom toast
            toast.add({
                type: "success",
                title: "Success!",
                description: 'Business knowledge saved successfully!'
            });
        } catch (error) {
            // Correct way to use your custom toast for error
            toast.add({
                type: "error",
                title: "Error!",
                description: 'Failed to save business knowledge'
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const onError = (formErrors) => {
        console.error('Form validation failed:', formErrors);
        toast.add({
            type: "error",
            title: "Please check the form",
            description: "Some required fields are missing or invalid."
        });
    };

    if (isLoading) {
        return (
            <div className="flex h-[60vh] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    const dataErrors = errors.data || {};

    return (
        <div className="flex justify-center px-4 py-6 sm:py-8">
            <div className="w-full max-w-4xl">
                {/* Header */}
                <div className="text-left space-y-2 mb-6">
                    <h1 className="text-2xl font-bold tracking-tight">Business Knowledge</h1>
                    <p className="text-sm text-muted-foreground">
                        Help TeleAgent understand your business so its AI agents can answer customers accurately.
                    </p>
                </div>

                <form onSubmit={handleSubmit(onSubmit, onError)} className="space-y-8">
                    {/* RESTAURANT KNOWLEDGE */}
                    <div className="space-y-6">
                        {/* Business Identity */}
                        <KnowledgeTextarea
                            label="Business Identity"
                            description="Basic information about your restaurant and its concept."
                            placeholder="For example, We are Spice House, a family-friendly restaurant located in Lahore, Pakistan. We serve Pakistani, Chinese and fast food dishes for dine-in and delivery customers. Our restaurant is located on Main Boulevard and is open for lunch and dinner. Customers can contact us by phone or email for general questions, delivery information and other restaurant-related inquiries. We focus on fresh food, reasonable prices and quick service."
                            register={register}
                            name="data.businessIdentity"
                            maxLength={2000}
                            error={dataErrors.businessIdentity}
                        />

                        <Separator />

                        {/* Food Variety / Menu Information */}
                        <KnowledgeTextarea
                            label="Food Variety / Menu Information"
                            description="The cuisines, dishes, specialties, and food options you offer."
                            placeholder="For example,Our restaurant serves a variety of Pakistani, Chinese and fast food dishes. Pakistani food includes Chicken Karahi, Mutton Karahi, Chicken Biryani, Beef Biryani, Chicken Handi, Daal and BBQ items such as Chicken Tikka and Seekh Kabab. Our Chinese menu includes Chicken Chow Mein, Chicken Manchurian, Fried Rice, Chicken Shashlik and Hot & Sour Soup. Fast food options include Zinger Burger, Chicken Burger, Beef Burger, Chicken Shawarma, Loaded Fries and Pizza. We also serve soft drinks, fresh juices, milkshakes and desserts. Our popular dishes include Chicken Karahi, Zinger Burger and Chicken Chow Mein."
                            register={register}
                            name="data.foodVariety"
                            maxLength={4000}
                            error={dataErrors.foodVariety}
                        />

                        <Separator />

                        {/* Delivery Information */}
                        <KnowledgeTextarea
                            label="Delivery Information"
                            description="Your delivery areas, charges, minimum order, and delivery times."
                            placeholder="For example,We provide delivery within Lahore. Our regular delivery area includes areas within approximately 10 km of the restaurant. The minimum order for delivery is Rs. 500. Standard delivery charges are Rs. 150. Delivery usually takes 30–45 minutes depending on the customer's location and order volume. Free delivery is available for orders above Rs. 2,000 within our standard delivery area. Delivery to areas outside our normal delivery zone may not be available. During busy hours, weekends or special occasions, delivery may take longer than usual."
                            register={register}
                            name="data.deliveryInformation"
                            maxLength={2000}
                            error={dataErrors.deliveryInformation}
                        />

                        <Separator />

                        {/* Payment Information */}
                        <KnowledgeTextarea
                            label="Payment Information"
                            description="The payment methods available for delivery and dine-in customers."
                            placeholder="For example,For delivery orders, customers can pay using Cash on Delivery, Credit Card, Debit Card or Bank Transfer. For dine-in customers, we accept Cash, Credit Card and Debit Card payments. Customers should confirm the available payment method when placing large or special orders."
                            register={register}
                            name="data.paymentInformation"
                            maxLength={1000}
                            error={dataErrors.paymentInformation}
                        />

                        <Separator />

                        {/* Reservation Information */}
                        <KnowledgeTextarea
                            label="Reservation Information"
                            description="Instructions for handling reservation requests through TeleAgent."
                            placeholder="For example,TeleAgent currently does not support creating or recording restaurant reservations. If a customer asks to reserve a table, inform them that reservations cannot be made through TeleAgent and ask them to contact the restaurant directly at the provided phone number. Do not tell customers that a reservation has been created or confirmed through the system."
                            register={register}
                            name="data.reservationInformation"
                            maxLength={1000}
                            error={dataErrors.reservationInformation}
                        />

                        <Separator />

                        {/* Weekly Schedule */}
                        <BusinessHoursSection
                            register={register}
                            watch={watch}
                            setValue={setValue}
                        />
                    </div>

                    {/* ============================================ */}
                    {/* NAVIGATION */}
                    {/* ============================================ */}
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-border">
                        <Button
                            type="submit"
                            className="h-10 text-sm font-medium w-full sm:w-auto"
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Saving...
                                </>
                            ) : (
                                'Update '
                            )}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default BusinessKnowledgePage;