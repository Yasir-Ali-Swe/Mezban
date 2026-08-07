// 'use client';

// import { useState, useRef, useEffect } from 'react';
// import { useForm } from 'react-hook-form';
// import { zodResolver } from '@hookform/resolvers/zod';
// import * as z from 'zod';
// import { Input } from '@/components/ui/input';
// import { Textarea } from '@/components/ui/textarea';
// import { Button } from '@/components/ui/button';
// import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
// import {
//     Field,
//     FieldLabel,
//     FieldError,
//     FieldGroup,
//     FieldContent,
//     FieldDescription,
// } from '@/components/ui/field';
// import {
//     Select,
//     SelectContent,
//     SelectGroup,
//     SelectItem,
//     SelectLabel,
//     SelectTrigger,
//     SelectValue,
// } from '@/components/ui/select';
// import { Camera, Loader2 } from 'lucide-react';
// import { cn } from '@/lib/utils';
// import { toast } from 'sonner';

// // Dummy restaurant profile data
// const DUMMY_RESTAURANT_PROFILE = {
//     _id: 'rest_123456789',
//     name: 'Pizza Palace',
//     description: 'Authentic Italian pizzas made with fresh ingredients, wood-fired to perfection. Serving the community since 2010.',
//     city: 'Lahore',
//     address: '123 Main Boulevard, Gulberg III',
//     phone: '+92 300 1234567',
//     email: 'info@pizzapalace.com',
//     deliveryAreas: ['Gulberg', 'Model Town', 'Johar Town', 'DHA'],
//     workingHours: 'Mon-Sun: 11:00 AM - 11:00 PM',
//     minimumOrderAmount: 500,
//     deliveryFee: 150,
//     estimatedDeliveryTime: '30-45 min',
//     imageUrl: 'https://ui-avatars.com/api/?name=Pizza+Palace&background=EF4444&color=fff&size=128',
// };

// // Dummy cities for dropdown
// const DUMMY_CITIES = [
//     { _id: '1', name: 'Lahore' },
//     { _id: '2', name: 'Karachi' },
//     { _id: '3', name: 'Islamabad' },
//     { _id: '4', name: 'Rawalpindi' },
//     { _id: '5', name: 'Multan' },
//     { _id: '6', name: 'Faisalabad' },
//     { _id: '7', name: 'Peshawar' },
//     { _id: '8', name: 'Quetta' },
// ];

// // Zod schema for validation
// const restaurantProfileSchema = z.object({
//     name: z.string().min(2, { message: 'Restaurant name must be at least 2 characters' }),
//     city: z.string().min(1, { message: 'Please select a city' }),
//     address: z.string().min(5, { message: 'Address is required' }),
//     phone: z.string().min(10, { message: 'Please enter a valid phone number' }),
//     email: z.string().email({ message: 'Please enter a valid email address' }),
//     deliveryAreas: z.string().min(1, { message: 'Delivery areas are required' }),
//     workingHours: z.string().min(1, { message: 'Working hours are required' }),
//     minimumOrderAmount: z.string().min(1, { message: 'Minimum order amount is required' }),
//     deliveryFee: z.string().min(1, { message: 'Delivery fee is required' }),
//     estimatedDeliveryTime: z.string().min(1, { message: 'Estimated delivery time is required' }),
//     description: z.string()
//         .min(10, { message: 'Description must be at least 10 characters' })
//         .max(4000, { message: 'Description cannot exceed 4000 characters' }),
// });

// const RestaurantProfilePage = () => {
//     const fileInputRef = useRef(null);
//     const [previewImage, setPreviewImage] = useState(null);
//     const [selectedFile, setSelectedFile] = useState(null);
//     const [isLoading, setIsLoading] = useState(true);
//     const [isPending, setIsPending] = useState(false);
//     const [originalValues, setOriginalValues] = useState({
//         name: '',
//         city: '',
//         address: '',
//         phone: '',
//         email: '',
//         deliveryAreas: '',
//         workingHours: '',
//         minimumOrderAmount: '',
//         deliveryFee: '',
//         estimatedDeliveryTime: '',
//         description: '',
//     });

//     // Simulate API call to fetch restaurant profile
//     useEffect(() => {
//         const timer = setTimeout(() => {
//             const profile = DUMMY_RESTAURANT_PROFILE;
//             const cityName = DUMMY_CITIES.find(c => c.name === profile.city)?.name || '';
//             reset({
//                 name: profile.name || '',
//                 city: cityName || '',
//                 address: profile.address || '',
//                 phone: profile.phone || '',
//                 email: profile.email || '',
//                 deliveryAreas: Array.isArray(profile.deliveryAreas)
//                     ? profile.deliveryAreas.join(', ')
//                     : profile.deliveryAreas || '',
//                 workingHours: profile.workingHours || '',
//                 minimumOrderAmount: profile.minimumOrderAmount?.toString() || '',
//                 deliveryFee: profile.deliveryFee?.toString() || '',
//                 estimatedDeliveryTime: profile.estimatedDeliveryTime || '',
//                 description: profile.description || '',
//             });
//             setOriginalValues({
//                 name: profile.name || '',
//                 city: cityName || '',
//                 address: profile.address || '',
//                 phone: profile.phone || '',
//                 email: profile.email || '',
//                 deliveryAreas: Array.isArray(profile.deliveryAreas)
//                     ? profile.deliveryAreas.join(', ')
//                     : profile.deliveryAreas || '',
//                 workingHours: profile.workingHours || '',
//                 minimumOrderAmount: profile.minimumOrderAmount?.toString() || '',
//                 deliveryFee: profile.deliveryFee?.toString() || '',
//                 estimatedDeliveryTime: profile.estimatedDeliveryTime || '',
//                 description: profile.description || '',
//             });
//             if (profile.imageUrl) {
//                 setPreviewImage(profile.imageUrl);
//             }
//             setIsLoading(false);
//         }, 800);

//         return () => clearTimeout(timer);
//     }, []);

//     const {
//         register,
//         handleSubmit,
//         watch,
//         reset,
//         setValue,
//         formState: { errors },
//     } = useForm({
//         resolver: zodResolver(restaurantProfileSchema),
//         defaultValues: {
//             name: '',
//             city: '',
//             address: '',
//             phone: '',
//             email: '',
//             deliveryAreas: '',
//             workingHours: '',
//             minimumOrderAmount: '',
//             deliveryFee: '',
//             estimatedDeliveryTime: '',
//             description: '',
//         },
//     });

//     const watchedName = watch('name');
//     const watchedCity = watch('city');
//     const watchedAddress = watch('address');
//     const watchedPhone = watch('phone');
//     const watchedEmail = watch('email');
//     const watchedDeliveryAreas = watch('deliveryAreas');
//     const watchedWorkingHours = watch('workingHours');
//     const watchedMinimumOrderAmount = watch('minimumOrderAmount');
//     const watchedDeliveryFee = watch('deliveryFee');
//     const watchedEstimatedDeliveryTime = watch('estimatedDeliveryTime');
//     const watchedDescription = watch('description');

//     // Check if form has changes
//     const hasChanges = () => {
//         return (
//             (watchedName || '') !== originalValues.name ||
//             (watchedCity || '') !== originalValues.city ||
//             (watchedAddress || '') !== originalValues.address ||
//             (watchedPhone || '') !== originalValues.phone ||
//             (watchedEmail || '') !== originalValues.email ||
//             (watchedDeliveryAreas || '') !== originalValues.deliveryAreas ||
//             (watchedWorkingHours || '') !== originalValues.workingHours ||
//             (watchedMinimumOrderAmount || '') !== originalValues.minimumOrderAmount ||
//             (watchedDeliveryFee || '') !== originalValues.deliveryFee ||
//             (watchedEstimatedDeliveryTime || '') !== originalValues.estimatedDeliveryTime ||
//             (watchedDescription || '') !== originalValues.description ||
//             selectedFile !== null
//         );
//     };

//     // Handle image selection
//     const handleImageSelect = (event) => {
//         const file = event.target.files?.[0];
//         if (file) {
//             setSelectedFile(file);
//             const objectUrl = URL.createObjectURL(file);
//             setPreviewImage(objectUrl);
//         }
//     };

//     // Handle image click to trigger file input
//     const handleAvatarClick = () => {
//         fileInputRef.current?.click();
//     };

//     // Handle form submission
//     const onSubmit = (values) => {
//         setIsPending(true);

//         // Simulate API call
//         setTimeout(() => {
//             setOriginalValues({
//                 name: values.name,
//                 city: values.city,
//                 address: values.address,
//                 phone: values.phone,
//                 email: values.email,
//                 deliveryAreas: values.deliveryAreas,
//                 workingHours: values.workingHours,
//                 minimumOrderAmount: values.minimumOrderAmount,
//                 deliveryFee: values.deliveryFee,
//                 estimatedDeliveryTime: values.estimatedDeliveryTime,
//                 description: values.description,
//             });

//             if (selectedFile) {
//                 setSelectedFile(null);
//             }

//             toast.success('Restaurant profile updated successfully!');
//             setIsPending(false);
//             reset(values);
//         }, 1500);
//     };

//     if (isLoading) {
//         return (
//             <div className="flex h-[60vh] items-center justify-center">
//                 <Loader2 className="h-8 w-8 animate-spin text-primary" />
//             </div>
//         );
//     }

//     const avatarImage = previewImage || DUMMY_RESTAURANT_PROFILE.imageUrl || '';
//     const initials = DUMMY_RESTAURANT_PROFILE.name
//         ?.split(' ')
//         .map((n) => n[0])
//         .join('')
//         .toUpperCase()
//         .slice(0, 2) || 'R';

//     return (
//         <div className="flex justify-center px-4 py-6 sm:py-8">
//             <div className="w-full max-w-2xl">
//                 {/* Header */}
//                 <div className="text-center space-y-2 mb-6">
//                     <h1 className="text-2xl font-bold tracking-tight">Restaurant Profile</h1>
//                     <p className="text-sm text-muted-foreground">
//                         This information is used by the AI agent to answer customer queries
//                     </p>
//                 </div>

//                 {/* Form */}
//                 <form onSubmit={handleSubmit(onSubmit)}>
//                     <FieldGroup className="space-y-4">
//                         {/* Profile Image */}
//                         <div className="flex justify-center">
//                             <div className="relative group">
//                                 <Avatar
//                                     className="h-24 w-24 cursor-pointer transition-opacity hover:opacity-90"
//                                     onClick={handleAvatarClick}
//                                 >
//                                     <AvatarImage src={avatarImage} alt="Restaurant" />
//                                     <AvatarFallback className="text-2xl bg-primary text-primary-foreground">
//                                         {initials}
//                                     </AvatarFallback>
//                                 </Avatar>
//                                 <button
//                                     type="button"
//                                     className={cn(
//                                         "absolute bottom-0 right-0 bg-primary p-2 text-primary-foreground shadow-sm",
//                                         "transition-all hover:bg-primary/90 hover:scale-110",
//                                         "ring-2 ring-background rounded-full"
//                                     )}
//                                     onClick={handleAvatarClick}
//                                 >
//                                     <Camera className="h-4 w-4" />
//                                 </button>
//                                 <input
//                                     ref={fileInputRef}
//                                     type="file"
//                                     accept="image/*"
//                                     className="hidden"
//                                     onChange={handleImageSelect}
//                                 />
//                             </div>
//                         </div>
//                         {selectedFile && (
//                             <p className="text-center text-xs text-muted-foreground">
//                                 New image selected: {selectedFile.name}
//                             </p>
//                         )}

//                         {/* Row 1: Restaurant Name + City (Dropdown) */}
//                         <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
//                             <Field orientation="vertical">
//                                 <FieldLabel htmlFor="name" className="text-sm font-medium">
//                                     Restaurant Name <span className="text-destructive">*</span>
//                                 </FieldLabel>
//                                 <FieldContent>
//                                     <Input
//                                         id="name"
//                                         type="text"
//                                         placeholder="Enter restaurant name"
//                                         className="h-10 text-sm"
//                                         {...register("name")}
//                                         aria-invalid={errors.name ? "true" : "false"}
//                                     />
//                                     {errors.name && (
//                                         <FieldError errors={[errors.name]} />
//                                     )}
//                                 </FieldContent>
//                             </Field>

//                             <Field orientation="vertical">
//                                 <FieldLabel htmlFor="city" className="text-sm font-medium">
//                                     City <span className="text-destructive">*</span>
//                                 </FieldLabel>
//                                 <FieldContent>
//                                     <Select
//                                         value={watchedCity}
//                                         onValueChange={(value) => setValue('city', value)}
//                                     >
//                                         <SelectTrigger className="w-full text-sm px-3 py-4.75">
//                                             <SelectValue placeholder="Select a city" />
//                                         </SelectTrigger>
//                                         <SelectContent>
//                                             <SelectGroup>
//                                                 <SelectLabel>Cities</SelectLabel>
//                                                 {DUMMY_CITIES.map((city) => (
//                                                     <SelectItem key={city._id} value={city.name}>
//                                                         {city.name}
//                                                     </SelectItem>
//                                                 ))}
//                                             </SelectGroup>
//                                         </SelectContent>
//                                     </Select>
//                                     {errors.city && (
//                                         <FieldError errors={[errors.city]} />
//                                     )}
//                                 </FieldContent>
//                             </Field>
//                         </div>

//                         {/* Row 2: Address (Textarea) */}
//                         <Field orientation="vertical">
//                             <FieldLabel htmlFor="address" className="text-sm font-medium">
//                                 Address <span className="text-destructive">*</span>
//                             </FieldLabel>
//                             <FieldContent>
//                                 <Textarea
//                                     id="address"
//                                     placeholder="Enter street address"
//                                     className="h-20 text-sm resize-none"
//                                     {...register("address")}
//                                     aria-invalid={errors.address ? "true" : "false"}
//                                 />
//                                 {errors.address && (
//                                     <FieldError errors={[errors.address]} />
//                                 )}
//                             </FieldContent>
//                         </Field>

//                         {/* Row 3: Phone Number + Email */}
//                         <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
//                             <Field orientation="vertical">
//                                 <FieldLabel htmlFor="phone" className="text-sm font-medium">
//                                     Phone Number <span className="text-destructive">*</span>
//                                 </FieldLabel>
//                                 <FieldContent>
//                                     <Input
//                                         id="phone"
//                                         type="tel"
//                                         placeholder="Enter phone number"
//                                         className="h-10 text-sm"
//                                         {...register("phone")}
//                                         aria-invalid={errors.phone ? "true" : "false"}
//                                     />
//                                     {errors.phone && (
//                                         <FieldError errors={[errors.phone]} />
//                                     )}
//                                 </FieldContent>
//                             </Field>

//                             <Field orientation="vertical">
//                                 <FieldLabel htmlFor="email" className="text-sm font-medium">
//                                     Email Address <span className="text-destructive">*</span>
//                                 </FieldLabel>
//                                 <FieldContent>
//                                     <Input
//                                         id="email"
//                                         type="email"
//                                         placeholder="Enter email address"
//                                         className="h-10 text-sm"
//                                         {...register("email")}
//                                         aria-invalid={errors.email ? "true" : "false"}
//                                     />
//                                     {errors.email && (
//                                         <FieldError errors={[errors.email]} />
//                                     )}
//                                 </FieldContent>
//                             </Field>
//                         </div>

//                         {/* Row 4: Delivery Areas + Working Hours */}
//                         <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
//                             <Field orientation="vertical">
//                                 <FieldLabel htmlFor="deliveryAreas" className="text-sm font-medium">
//                                     Delivery Areas <span className="text-destructive">*</span>
//                                 </FieldLabel>
//                                 <FieldContent>
//                                     <Input
//                                         id="deliveryAreas"
//                                         type="text"
//                                         placeholder="e.g., Gulberg, Model Town"
//                                         className="h-10 text-sm"
//                                         {...register("deliveryAreas")}
//                                         aria-invalid={errors.deliveryAreas ? "true" : "false"}
//                                     />
//                                     {errors.deliveryAreas && (
//                                         <FieldError errors={[errors.deliveryAreas]} />
//                                     )}
//                                 </FieldContent>
//                             </Field>

//                             <Field orientation="vertical">
//                                 <FieldLabel htmlFor="workingHours" className="text-sm font-medium">
//                                     Working Hours <span className="text-destructive">*</span>
//                                 </FieldLabel>
//                                 <FieldContent>
//                                     <Input
//                                         id="workingHours"
//                                         type="text"
//                                         placeholder="e.g., Mon-Sun: 11:00 AM - 11:00 PM"
//                                         className="h-10 text-sm"
//                                         {...register("workingHours")}
//                                         aria-invalid={errors.workingHours ? "true" : "false"}
//                                     />
//                                     {errors.workingHours && (
//                                         <FieldError errors={[errors.workingHours]} />
//                                     )}
//                                 </FieldContent>
//                             </Field>
//                         </div>

//                         {/* Row 5: MOA + Delivery Fee + Estimated Delivery Time */}
//                         <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
//                             <Field orientation="vertical">
//                                 <FieldLabel htmlFor="minimumOrderAmount" className="text-sm font-medium">
//                                     Minimum Order Amount <span className="text-destructive">*</span>
//                                 </FieldLabel>
//                                 <FieldContent>
//                                     <Input
//                                         id="minimumOrderAmount"
//                                         type="number"
//                                         step="1"
//                                         min="0"
//                                         placeholder="500"
//                                         className="h-10 text-sm"
//                                         {...register("minimumOrderAmount")}
//                                         aria-invalid={errors.minimumOrderAmount ? "true" : "false"}
//                                     />
//                                     {errors.minimumOrderAmount && (
//                                         <FieldError errors={[errors.minimumOrderAmount]} />
//                                     )}
//                                 </FieldContent>
//                             </Field>

//                             <Field orientation="vertical">
//                                 <FieldLabel htmlFor="deliveryFee" className="text-sm font-medium">
//                                     Delivery Fee <span className="text-destructive">*</span>
//                                 </FieldLabel>
//                                 <FieldContent>
//                                     <Input
//                                         id="deliveryFee"
//                                         type="number"
//                                         step="1"
//                                         min="0"
//                                         placeholder="150"
//                                         className="h-10 text-sm"
//                                         {...register("deliveryFee")}
//                                         aria-invalid={errors.deliveryFee ? "true" : "false"}
//                                     />
//                                     {errors.deliveryFee && (
//                                         <FieldError errors={[errors.deliveryFee]} />
//                                     )}
//                                 </FieldContent>
//                             </Field>

//                             <Field orientation="vertical">
//                                 <FieldLabel htmlFor="estimatedDeliveryTime" className="text-sm font-medium">
//                                     Est. Delivery Time <span className="text-destructive">*</span>
//                                 </FieldLabel>
//                                 <FieldContent>
//                                     <Input
//                                         id="estimatedDeliveryTime"
//                                         type="text"
//                                         placeholder="e.g., 30-45 min"
//                                         className="h-10 text-sm"
//                                         {...register("estimatedDeliveryTime")}
//                                         aria-invalid={errors.estimatedDeliveryTime ? "true" : "false"}
//                                     />
//                                     {errors.estimatedDeliveryTime && (
//                                         <FieldError errors={[errors.estimatedDeliveryTime]} />
//                                     )}
//                                 </FieldContent>
//                             </Field>
//                         </div>

//                         {/* Row 6: Description - Full Width */}
//                         <Field orientation="vertical">
//                             <FieldLabel htmlFor="description" className="text-sm font-medium">
//                                 Description <span className="text-destructive">*</span>
//                             </FieldLabel>
//                             <FieldDescription>
//                                 Describe your restaurant... This information is used by the AI agent to answer customer queries
//                             </FieldDescription>
//                             <FieldContent>
//                                 <Textarea
//                                     id="description"
//                                     placeholder="Restaurant description..."
//                                     className={cn(
//                                         "text-sm resize-none",
//                                         "min-h-40 max-h-80",
//                                     )}
//                                     maxLength={4000}
//                                     {...register("description")}
//                                     aria-invalid={errors.description ? "true" : "false"}
//                                 />
//                                 <div className="flex justify-end mt-1">
//                                     <span className={cn(
//                                         "text-xs",
//                                         (watchedDescription?.length || 0) <= 2000 && "text-muted-foreground",
//                                         (watchedDescription?.length || 0) > 2000 && (watchedDescription?.length || 0) <= 3000 && "text-yellow-500",
//                                         (watchedDescription?.length || 0) > 3000 && "text-red-500"
//                                     )}>
//                                         {watchedDescription?.length || 0} / 4000 characters
//                                     </span>
//                                 </div>
//                                 {errors.description && (
//                                     <FieldError errors={[errors.description]} />
//                                 )}
//                             </FieldContent>
//                         </Field>

//                         {/* Update Button */}
//                         <Button
//                             type="submit"
//                             className="w-full h-10 text-sm font-medium"
//                             disabled={!hasChanges() || isPending}
//                         >
//                             {isPending ? (
//                                 <>
//                                     <Loader2 className="mr-2 h-4 w-4 animate-spin" />
//                                     Updating...
//                                 </>
//                             ) : (
//                                 'Update Restaurant Profile'
//                             )}
//                         </Button>
//                     </FieldGroup>
//                 </form>
//             </div>
//         </div>
//     );
// };

// export default RestaurantProfilePage;


'use client';

import { useState, useRef, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
    Field,
    FieldLabel,
    FieldError,
    FieldGroup,
    FieldContent,
    FieldDescription,
} from '@/components/ui/field';
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectLabel,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Camera, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

// Dummy restaurant profile data
const DUMMY_RESTAURANT_PROFILE = {
    _id: 'rest_123456789',
    name: 'Pizza Palace',
    description: 'Authentic Italian pizzas made with fresh ingredients, wood-fired to perfection. Serving the community since 2010.',
    city: 'Lahore',
    address: '123 Main Boulevard, Gulberg III',
    phone: '+92 300 1234567',
    email: 'info@pizzapalace.com',
    deliveryAreas: ['Gulberg', 'Model Town', 'Johar Town', 'DHA'],
    workingHours: 'Mon-Sun: 11:00 AM - 11:00 PM',
    minimumOrderAmount: 500,
    deliveryFee: 150,
    estimatedDeliveryTime: '30-45 min',
    imageUrl: 'https://ui-avatars.com/api/?name=Pizza+Palace&background=EF4444&color=fff&size=128',
};

// Dummy cities for dropdown
const DUMMY_CITIES = [
    { _id: '1', name: 'Lahore' },
    { _id: '2', name: 'Karachi' },
    { _id: '3', name: 'Islamabad' },
    { _id: '4', name: 'Rawalpindi' },
    { _id: '5', name: 'Multan' },
    { _id: '6', name: 'Faisalabad' },
    { _id: '7', name: 'Peshawar' },
    { _id: '8', name: 'Quetta' },
];

// Zod schema for validation
const restaurantProfileSchema = z.object({
    name: z.string().min(2, { message: 'Restaurant name must be at least 2 characters' }),
    city: z.string().min(1, { message: 'Please select a city' }),
    address: z.string().min(5, { message: 'Address is required' }),
    phone: z.string().min(10, { message: 'Please enter a valid phone number' }),
    email: z.string().email({ message: 'Please enter a valid email address' }),
    deliveryAreas: z.string().min(1, { message: 'Delivery areas are required' }),
    workingHours: z.string().min(1, { message: 'Working hours are required' }),
    minimumOrderAmount: z.string().min(1, { message: 'Minimum order amount is required' }),
    deliveryFee: z.string().min(1, { message: 'Delivery fee is required' }),
    estimatedDeliveryTime: z.string().min(1, { message: 'Estimated delivery time is required' }),
    description: z.string()
        .min(10, { message: 'Description must be at least 10 characters' })
        .max(4000, { message: 'Description cannot exceed 4000 characters' }),
});

const RestaurantProfilePage = () => {
    const fileInputRef = useRef(null);
    const [previewImage, setPreviewImage] = useState(null);
    const [selectedFile, setSelectedFile] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isPending, setIsPending] = useState(false);
    const [originalValues, setOriginalValues] = useState({
        name: '',
        city: '',
        address: '',
        phone: '',
        email: '',
        deliveryAreas: '',
        workingHours: '',
        minimumOrderAmount: '',
        deliveryFee: '',
        estimatedDeliveryTime: '',
        description: '',
    });

    // Simulate API call to fetch restaurant profile
    useEffect(() => {
        const timer = setTimeout(() => {
            const profile = DUMMY_RESTAURANT_PROFILE;
            const cityName = DUMMY_CITIES.find(c => c.name === profile.city)?.name || '';
            reset({
                name: profile.name || '',
                city: cityName || '',
                address: profile.address || '',
                phone: profile.phone || '',
                email: profile.email || '',
                deliveryAreas: Array.isArray(profile.deliveryAreas)
                    ? profile.deliveryAreas.join(', ')
                    : profile.deliveryAreas || '',
                workingHours: profile.workingHours || '',
                minimumOrderAmount: profile.minimumOrderAmount?.toString() || '',
                deliveryFee: profile.deliveryFee?.toString() || '',
                estimatedDeliveryTime: profile.estimatedDeliveryTime || '',
                description: profile.description || '',
            });
            setOriginalValues({
                name: profile.name || '',
                city: cityName || '',
                address: profile.address || '',
                phone: profile.phone || '',
                email: profile.email || '',
                deliveryAreas: Array.isArray(profile.deliveryAreas)
                    ? profile.deliveryAreas.join(', ')
                    : profile.deliveryAreas || '',
                workingHours: profile.workingHours || '',
                minimumOrderAmount: profile.minimumOrderAmount?.toString() || '',
                deliveryFee: profile.deliveryFee?.toString() || '',
                estimatedDeliveryTime: profile.estimatedDeliveryTime || '',
                description: profile.description || '',
            });
            if (profile.imageUrl) {
                setPreviewImage(profile.imageUrl);
            }
            setIsLoading(false);
        }, 800);

        return () => clearTimeout(timer);
    }, []);

    const {
        register,
        handleSubmit,
        watch,
        reset,
        setValue,
        formState: { errors },
    } = useForm({
        resolver: zodResolver(restaurantProfileSchema),
        defaultValues: {
            name: '',
            city: '',
            address: '',
            phone: '',
            email: '',
            deliveryAreas: '',
            workingHours: '',
            minimumOrderAmount: '',
            deliveryFee: '',
            estimatedDeliveryTime: '',
            description: '',
        },
    });

    const watchedName = watch('name');
    const watchedCity = watch('city');
    const watchedAddress = watch('address');
    const watchedPhone = watch('phone');
    const watchedEmail = watch('email');
    const watchedDeliveryAreas = watch('deliveryAreas');
    const watchedWorkingHours = watch('workingHours');
    const watchedMinimumOrderAmount = watch('minimumOrderAmount');
    const watchedDeliveryFee = watch('deliveryFee');
    const watchedEstimatedDeliveryTime = watch('estimatedDeliveryTime');
    const watchedDescription = watch('description');

    // Check if form has changes
    const hasChanges = () => {
        return (
            (watchedName || '') !== originalValues.name ||
            (watchedCity || '') !== originalValues.city ||
            (watchedAddress || '') !== originalValues.address ||
            (watchedPhone || '') !== originalValues.phone ||
            (watchedEmail || '') !== originalValues.email ||
            (watchedDeliveryAreas || '') !== originalValues.deliveryAreas ||
            (watchedWorkingHours || '') !== originalValues.workingHours ||
            (watchedMinimumOrderAmount || '') !== originalValues.minimumOrderAmount ||
            (watchedDeliveryFee || '') !== originalValues.deliveryFee ||
            (watchedEstimatedDeliveryTime || '') !== originalValues.estimatedDeliveryTime ||
            (watchedDescription || '') !== originalValues.description ||
            selectedFile !== null
        );
    };

    // Handle image selection
    const handleImageSelect = (event) => {
        const file = event.target.files?.[0];
        if (file) {
            setSelectedFile(file);
            const objectUrl = URL.createObjectURL(file);
            setPreviewImage(objectUrl);
        }
    };

    // Handle image click to trigger file input
    const handleAvatarClick = () => {
        fileInputRef.current?.click();
    };

    // Handle form submission
    const onSubmit = (values) => {
        setIsPending(true);

        // Simulate API call
        setTimeout(() => {
            setOriginalValues({
                name: values.name,
                city: values.city,
                address: values.address,
                phone: values.phone,
                email: values.email,
                deliveryAreas: values.deliveryAreas,
                workingHours: values.workingHours,
                minimumOrderAmount: values.minimumOrderAmount,
                deliveryFee: values.deliveryFee,
                estimatedDeliveryTime: values.estimatedDeliveryTime,
                description: values.description,
            });

            if (selectedFile) {
                setSelectedFile(null);
            }

            toast.success('Restaurant profile updated successfully!');
            setIsPending(false);
            reset(values);
        }, 1500);
    };

    if (isLoading) {
        return (
            <div className="flex h-[60vh] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    const avatarImage = previewImage || DUMMY_RESTAURANT_PROFILE.imageUrl || '';
    const initials = DUMMY_RESTAURANT_PROFILE.name
        ?.split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2) || 'R';

    return (
        <div className="flex justify-center px-4 py-6 sm:py-8">
            <div className="w-full max-w-2xl">
                {/* Header */}
                <div className="text-center space-y-2 mb-6">
                    <h1 className="text-2xl font-bold tracking-tight">Restaurant Profile</h1>
                    <p className="text-sm text-muted-foreground">
                        This information is used by the AI agent to answer customer queries
                    </p>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit(onSubmit)}>
                    <FieldGroup className="space-y-4">
                        {/* Profile Image */}
                        <div className="flex justify-center">
                            <div className="relative group">
                                <Avatar
                                    className="h-24 w-24 cursor-pointer transition-opacity hover:opacity-90"
                                    onClick={handleAvatarClick}
                                >
                                    <AvatarImage src={avatarImage} alt="Restaurant" />
                                    <AvatarFallback className="text-2xl bg-primary text-primary-foreground">
                                        {initials}
                                    </AvatarFallback>
                                </Avatar>
                                <button
                                    type="button"
                                    className={cn(
                                        "absolute bottom-0 right-0 bg-primary p-2 text-primary-foreground shadow-sm",
                                        "transition-all hover:bg-primary/90 hover:scale-110",
                                        "ring-2 ring-background rounded-full"
                                    )}
                                    onClick={handleAvatarClick}
                                >
                                    <Camera className="h-4 w-4" />
                                </button>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={handleImageSelect}
                                />
                            </div>
                        </div>
                        {selectedFile && (
                            <p className="text-center text-xs text-muted-foreground">
                                New image selected: {selectedFile.name}
                            </p>
                        )}

                        {/* Row 1: Restaurant Name + City (Dropdown) */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <Field orientation="vertical">
                                <FieldLabel htmlFor="name" className="text-sm font-medium">
                                    Restaurant Name <span className="text-destructive">*</span>
                                </FieldLabel>
                                <FieldContent>
                                    <Input
                                        id="name"
                                        type="text"
                                        placeholder="Enter restaurant name"
                                        className="h-10 text-sm"
                                        {...register("name")}
                                        aria-invalid={errors.name ? "true" : "false"}
                                    />
                                    {errors.name && (
                                        <FieldError errors={[errors.name]} />
                                    )}
                                </FieldContent>
                            </Field>

                            <Field orientation="vertical">
                                <FieldLabel htmlFor="city" className="text-sm font-medium">
                                    City <span className="text-destructive">*</span>
                                </FieldLabel>
                                <FieldContent>
                                    <Select
                                        value={watchedCity}
                                        onValueChange={(value) => setValue('city', value)}
                                    >
                                        <SelectTrigger className="w-full text-sm px-3 py-4.75">
                                            <SelectValue placeholder="Select a city" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectGroup>
                                                <SelectLabel>Cities</SelectLabel>
                                                {DUMMY_CITIES.map((city) => (
                                                    <SelectItem key={city._id} value={city.name}>
                                                        {city.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectGroup>
                                        </SelectContent>
                                    </Select>
                                    {errors.city && (
                                        <FieldError errors={[errors.city]} />
                                    )}
                                </FieldContent>
                            </Field>
                        </div>

                        {/* Row 2: Address (Textarea) */}
                        <Field orientation="vertical">
                            <FieldLabel htmlFor="address" className="text-sm font-medium">
                                Address <span className="text-destructive">*</span>
                            </FieldLabel>
                            <FieldContent>
                                <Textarea
                                    id="address"
                                    placeholder="Enter street address"
                                    className="h-20 text-sm resize-none"
                                    {...register("address")}
                                    aria-invalid={errors.address ? "true" : "false"}
                                />
                                {errors.address && (
                                    <FieldError errors={[errors.address]} />
                                )}
                            </FieldContent>
                        </Field>

                        {/* Row 3: Phone Number + Email */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <Field orientation="vertical">
                                <FieldLabel htmlFor="phone" className="text-sm font-medium">
                                    Phone Number <span className="text-destructive">*</span>
                                </FieldLabel>
                                <FieldContent>
                                    <Input
                                        id="phone"
                                        type="tel"
                                        placeholder="Enter phone number"
                                        className="h-10 text-sm"
                                        {...register("phone")}
                                        aria-invalid={errors.phone ? "true" : "false"}
                                    />
                                    {errors.phone && (
                                        <FieldError errors={[errors.phone]} />
                                    )}
                                </FieldContent>
                            </Field>

                            <Field orientation="vertical">
                                <FieldLabel htmlFor="email" className="text-sm font-medium">
                                    Email Address <span className="text-destructive">*</span>
                                </FieldLabel>
                                <FieldContent>
                                    <Input
                                        id="email"
                                        type="email"
                                        placeholder="Enter email address"
                                        className="h-10 text-sm"
                                        {...register("email")}
                                        aria-invalid={errors.email ? "true" : "false"}
                                    />
                                    {errors.email && (
                                        <FieldError errors={[errors.email]} />
                                    )}
                                </FieldContent>
                            </Field>
                        </div>

                        {/* Row 4: Delivery Areas + Working Hours */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <Field orientation="vertical">
                                <FieldLabel htmlFor="deliveryAreas" className="text-sm font-medium">
                                    Delivery Areas <span className="text-destructive">*</span>
                                </FieldLabel>
                                <FieldContent>
                                    <Input
                                        id="deliveryAreas"
                                        type="text"
                                        placeholder="e.g., Gulberg, Model Town"
                                        className="h-10 text-sm"
                                        {...register("deliveryAreas")}
                                        aria-invalid={errors.deliveryAreas ? "true" : "false"}
                                    />
                                    {errors.deliveryAreas && (
                                        <FieldError errors={[errors.deliveryAreas]} />
                                    )}
                                </FieldContent>
                            </Field>

                            <Field orientation="vertical">
                                <FieldLabel htmlFor="workingHours" className="text-sm font-medium">
                                    Working Hours <span className="text-destructive">*</span>
                                </FieldLabel>
                                <FieldContent>
                                    <Input
                                        id="workingHours"
                                        type="text"
                                        placeholder="e.g., Mon-Sun: 11:00 AM - 11:00 PM"
                                        className="h-10 text-sm"
                                        {...register("workingHours")}
                                        aria-invalid={errors.workingHours ? "true" : "false"}
                                    />
                                    {errors.workingHours && (
                                        <FieldError errors={[errors.workingHours]} />
                                    )}
                                </FieldContent>
                            </Field>
                        </div>

                        {/* Row 5: MOA + Delivery Fee + Estimated Delivery Time */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <Field orientation="vertical">
                                <FieldLabel htmlFor="minimumOrderAmount" className="text-sm font-medium">
                                    Minimum Order Amount <span className="text-destructive">*</span>
                                </FieldLabel>
                                <FieldContent>
                                    <Input
                                        id="minimumOrderAmount"
                                        type="number"
                                        step="1"
                                        min="0"
                                        placeholder="500"
                                        className="h-10 text-sm"
                                        {...register("minimumOrderAmount")}
                                        aria-invalid={errors.minimumOrderAmount ? "true" : "false"}
                                    />
                                    {errors.minimumOrderAmount && (
                                        <FieldError errors={[errors.minimumOrderAmount]} />
                                    )}
                                </FieldContent>
                            </Field>

                            <Field orientation="vertical">
                                <FieldLabel htmlFor="deliveryFee" className="text-sm font-medium">
                                    Delivery Fee <span className="text-destructive">*</span>
                                </FieldLabel>
                                <FieldContent>
                                    <Input
                                        id="deliveryFee"
                                        type="number"
                                        step="1"
                                        min="0"
                                        placeholder="150"
                                        className="h-10 text-sm"
                                        {...register("deliveryFee")}
                                        aria-invalid={errors.deliveryFee ? "true" : "false"}
                                    />
                                    {errors.deliveryFee && (
                                        <FieldError errors={[errors.deliveryFee]} />
                                    )}
                                </FieldContent>
                            </Field>

                            <Field orientation="vertical">
                                <FieldLabel htmlFor="estimatedDeliveryTime" className="text-sm font-medium">
                                    Est. Delivery Time <span className="text-destructive">*</span>
                                </FieldLabel>
                                <FieldContent>
                                    <Input
                                        id="estimatedDeliveryTime"
                                        type="text"
                                        placeholder="e.g., 30-45 min"
                                        className="h-10 text-sm"
                                        {...register("estimatedDeliveryTime")}
                                        aria-invalid={errors.estimatedDeliveryTime ? "true" : "false"}
                                    />
                                    {errors.estimatedDeliveryTime && (
                                        <FieldError errors={[errors.estimatedDeliveryTime]} />
                                    )}
                                </FieldContent>
                            </Field>
                        </div>

                        {/* Row 6: Description - Full Width */}
                        <Field orientation="vertical">
                            <FieldLabel htmlFor="description" className="text-sm font-medium">
                                Description <span className="text-destructive">*</span>
                            </FieldLabel>
                            <FieldDescription className="text-sm text-muted-foreground">
                                Describe your restaurant... This information is used by the AI agent to answer customer queries
                            </FieldDescription>
                            <FieldContent>
                                <Textarea
                                    id="description"
                                    placeholder="Restaurant description..."
                                    className="text-sm resize-none min-h-40 max-h-80"
                                    maxLength={4000}
                                    {...register("description")}
                                    aria-invalid={errors.description ? "true" : "false"}
                                />
                                <div className="flex justify-end mt-1">
                                    <span className={cn(
                                        "text-xs",
                                        (watchedDescription?.length || 0) <= 2000 && "text-muted-foreground",
                                        (watchedDescription?.length || 0) > 2000 && (watchedDescription?.length || 0) <= 3000 && "text-yellow-500",
                                        (watchedDescription?.length || 0) > 3000 && "text-red-500"
                                    )}>
                                        {watchedDescription?.length || 0} / 4000 characters
                                    </span>
                                </div>
                                {errors.description && (
                                    <FieldError errors={[errors.description]} />
                                )}
                            </FieldContent>
                        </Field>

                        {/* Update Button */}
                        <Button
                            type="submit"
                            className="w-full h-10 text-sm font-medium"
                            disabled={!hasChanges() || isPending}
                        >
                            {isPending ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Updating...
                                </>
                            ) : (
                                'Update Restaurant Profile'
                            )}
                        </Button>
                    </FieldGroup>
                </form>
            </div>
        </div>
    );
};

export default RestaurantProfilePage;