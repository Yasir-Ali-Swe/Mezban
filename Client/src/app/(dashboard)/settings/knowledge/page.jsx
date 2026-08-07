import RestaurantKnowledge from "@/components/business-knowledge/restaurant-knowledge.jsx";
import ClinicKnowledge from "@/components/business-knowledge/clinic-knowledge";
import EcommerceKnowledge from "@/components/business-knowledge/ecommerce-knowledge";

const BusinessType = "Restaurant"; // Replace with your actual business type logic

const Knowledge = () => {
    return (
        <div className="w-full h-full">
            {BusinessType === "Restaurant" ? <RestaurantKnowledge /> : BusinessType === "Clinic" ? <ClinicKnowledge /> : <EcommerceKnowledge />}
        </div>
    )
}

export default Knowledge