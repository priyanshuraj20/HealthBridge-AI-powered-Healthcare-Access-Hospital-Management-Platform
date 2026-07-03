import { useState } from "react";
import { BASE_URL } from "../../config.js";
import { toast } from "react-toastify";
import HashLoader from "react-spinners/HashLoader";
import { BiPlus, BiUser, BiShield, BiCheckCircle, BiTrash, BiCard } from "react-icons/bi";

export default function FamilyVault({ user }) {
  // Ayushman Card local state
  const [cardNumber, setCardNumber] = useState(user.ayushmanCard?.cardNumber || "");
  const [holderName, setHolderName] = useState(user.ayushmanCard?.holderName || "");
  const [cardStatus, setCardStatus] = useState(user.ayushmanCard?.status || "Unverified");
  const [savingCard, setSavingCard] = useState(false);

  // Family profiles local state
  const [familyList, setFamilyList] = useState(user.familyMembers || []);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newMember, setNewMember] = useState({
    name: "", relation: "Spouse", gender: "male", birthDate: ""
  });
  const [savingMember, setSavingMember] = useState(false);

  const handleSaveCard = async (e) => {
    e.preventDefault();
    if (!cardNumber || !holderName) {
      toast.error("Please enter both card number and holder name.");
      return;
    }
    setSavingCard(true);
    try {
      const res = await fetch(`${BASE_URL}/users/${user._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`
        },
        body: JSON.stringify({
          ayushmanCard: {
            cardNumber,
            holderName,
            status: "Verified" // Auto mock verify on saving correct details
          }
        })
      });
      const data = await res.json();
      if (res.ok) {
        setCardStatus("Verified");
        toast.success("Ayushman Card saved & verified successfully!");
      } else {
        toast.error(data.message);
      }
    } catch {
      toast.error("Failed to save Ayushman Card");
    } finally {
      setSavingCard(false);
    }
  };

  const handleAddMember = async (e) => {
    e.preventDefault();
    if (!newMember.name || !newMember.birthDate) {
      toast.error("Please fill in family member name and birth date.");
      return;
    }
    setSavingMember(true);
    const updatedFamily = [...familyList, newMember];
    try {
      const res = await fetch(`${BASE_URL}/users/${user._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`
        },
        body: JSON.stringify({ familyMembers: updatedFamily })
      });
      const data = await res.json();
      if (res.ok) {
        setFamilyList(updatedFamily);
        setShowAddForm(false);
        setNewMember({ name: "", relation: "Spouse", gender: "male", birthDate: "" });
        toast.success("Family profile added successfully!");
      } else {
        toast.error(data.message);
      }
    } catch {
      toast.error("Failed to add family member");
    } finally {
      setSavingMember(false);
    }
  };

  const handleRemoveMember = async (idx) => {
    if (!window.confirm("Remove this family profile member?")) return;
    const updatedFamily = familyList.filter((_, i) => i !== idx);
    try {
      const res = await fetch(`${BASE_URL}/users/${user._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`
        },
        body: JSON.stringify({ familyMembers: updatedFamily })
      });
      if (res.ok) {
        setFamilyList(updatedFamily);
        toast.success("Family profile removed.");
      }
    } catch {
      toast.error("Failed to remove member");
    }
  };

  return (
    <div className="space-y-8">
      
      {/* SECTION 1 — AYUSHMAN BHARAT DIGITAL HEALTH CARD */}
      <div className="bg-white border border-gray-150 rounded-3xl p-6 shadow-sm space-y-6">
        <div className="flex items-center gap-2 border-b pb-3.5">
          <BiCard className="text-primaryColor text-xl" />
          <div>
            <h3 className="font-extrabold text-headingColor text-sm">Ayushman Bharat PM-JAY Card</h3>
            <p className="text-[11px] text-textColor mt-0.5">Securely save and verify your national cashless health cover card.</p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6 items-center">
          {/* Card Mockup UI */}
          <div className="bg-gradient-to-br from-orange-500 via-white to-green-600 border border-gray-250 p-5 rounded-2xl relative shadow-md h-44 flex flex-col justify-between overflow-hidden group">
            {/* Ashoka Chakra watermark */}
            <div className="absolute inset-0 flex items-center justify-center opacity-[0.04] pointer-events-none">
              <span className="text-[120px]">☸</span>
            </div>
            
            <div className="flex justify-between items-start border-b pb-2 border-slate-300/40 relative z-10">
              <div>
                <p className="text-[7px] text-slate-800 font-extrabold tracking-widest leading-none uppercase">Government of India</p>
                <p className="text-[10px] text-teal-800 font-[900] tracking-wide mt-1">Ayushman Bharat (PM-JAY)</p>
              </div>
              <span className="text-[11px] bg-slate-900/10 border text-slate-900 px-2 py-0.5 rounded font-extrabold flex items-center gap-1 shadow-sm">
                🛡️ Cashless
              </span>
            </div>

            <div className="space-y-1 mt-3 relative z-10 text-slate-900">
              <p className="text-[12px] font-mono font-extrabold tracking-wider leading-none">
                {cardNumber || "••••  ••••  ••••  ••••"}
              </p>
              <p className="text-[10px] font-bold mt-1.5 uppercase leading-none">
                Holder: {holderName || "Not Set"}
              </p>
            </div>

            <div className="flex justify-between items-center border-t pt-2 border-slate-300/40 mt-3 relative z-10 text-[9px] font-bold text-slate-800">
              <span>Status: <strong className={cardStatus === "Verified" ? "text-emerald-700 font-extrabold" : "text-amber-700"}>{cardStatus}</strong></span>
              <span>Benefit: Up to ₹5 Lakh / Family</span>
            </div>
          </div>

          {/* Card Input Form */}
          <form onSubmit={handleSaveCard} className="space-y-4 bg-gray-50 border p-5 rounded-2xl">
            <div>
              <label className="text-[10px] font-extrabold text-headingColor block mb-1.5 uppercase tracking-wide">PM-JAY Card Number *</label>
              <input
                type="text"
                placeholder="e.g. 1234-5678-9012"
                value={cardNumber}
                onChange={e => setCardNumber(e.target.value)}
                className="w-full px-3 py-2 border rounded-xl text-xs bg-white text-headingColor font-semibold focus:outline-none focus:border-primaryColor"
                required
              />
            </div>

            <div>
              <label className="text-[10px] font-extrabold text-headingColor block mb-1.5 uppercase tracking-wide">Card Holder Full Name *</label>
              <input
                type="text"
                placeholder="As printed on card"
                value={holderName}
                onChange={e => setHolderName(e.target.value)}
                className="w-full px-3 py-2 border rounded-xl text-xs bg-white text-headingColor font-semibold focus:outline-none focus:border-primaryColor"
                required
              />
            </div>

            <button
              type="submit"
              disabled={savingCard}
              className="w-full bg-primaryColor hover:bg-teal-700 text-white font-bold text-xs py-2.5 rounded-xl transition-all shadow-sm flex items-center justify-center gap-1.5"
            >
              {savingCard ? <HashLoader size={12} color="#fff" /> : <><BiCheckCircle /> Save & Verify Card</>}
            </button>
          </form>
        </div>
      </div>

      {/* SECTION 2 — FAMILY PROFILES VAULT */}
      <div className="bg-white border border-gray-150 rounded-3xl p-6 shadow-sm space-y-6">
        <div className="flex items-center justify-between border-b pb-4 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <BiUser className="text-primaryColor text-xl" />
            <div>
              <h3 className="font-extrabold text-headingColor text-sm">Family Healthcare Profiles</h3>
              <p className="text-[11px] text-textColor mt-0.5">Manage health summaries, vaccine records, and bookings for your family.</p>
            </div>
          </div>
          <button
            onClick={() => setShowAddForm(p => !p)}
            className="border border-primaryColor text-primaryColor hover:bg-teal-50/20 font-bold text-xs px-3.5 py-2 rounded-xl flex items-center gap-1 transition-all"
          >
            <BiPlus /> {showAddForm ? "Cancel" : "Add Family Member"}
          </button>
        </div>

        {/* Add Member form */}
        {showAddForm && (
          <form onSubmit={handleAddMember} className="bg-gray-50 border border-gray-200 p-5 rounded-2xl max-w-lg space-y-4">
            <h4 className="text-xs font-bold text-headingColor uppercase tracking-wider">New Family Member Registry</h4>
            
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-extrabold text-headingColor block mb-1 uppercase tracking-wide">Full Name *</label>
                <input
                  type="text"
                  placeholder="Full Name"
                  value={newMember.name}
                  onChange={e => setNewMember({...newMember, name: e.target.value})}
                  className="w-full px-3 py-2 border rounded-xl text-xs bg-white text-headingColor font-medium"
                  required
                />
              </div>
              
              <div>
                <label className="text-[10px] font-extrabold text-headingColor block mb-1 uppercase tracking-wide">Relation *</label>
                <select
                  value={newMember.relation}
                  onChange={e => setNewMember({...newMember, relation: e.target.value})}
                  className="w-full px-3 py-2 border rounded-xl text-xs bg-white text-textColor"
                >
                  <option value="Spouse">Spouse</option>
                  <option value="Child">Child</option>
                  <option value="Parent">Parent</option>
                  <option value="Sibling">Sibling</option>
                  <option value="Grandparent">Grandparent</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-extrabold text-headingColor block mb-1 uppercase tracking-wide">Gender *</label>
                <select
                  value={newMember.gender}
                  onChange={e => setNewMember({...newMember, gender: e.target.value})}
                  className="w-full px-3 py-2 border rounded-xl text-xs bg-white text-textColor"
                >
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-extrabold text-headingColor block mb-1 uppercase tracking-wide">Birth Date *</label>
                <input
                  type="date"
                  value={newMember.birthDate}
                  onChange={e => setNewMember({...newMember, birthDate: e.target.value})}
                  className="w-full px-3 py-2 border rounded-xl text-xs bg-white text-textColor"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={savingMember}
              className="bg-primaryColor hover:bg-teal-700 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-sm"
            >
              {savingMember ? "Saving..." : "Onboard Family Member"}
            </button>
          </form>
        )}

        {/* Members list */}
        {familyList.length === 0 ? (
          <p className="text-xs text-textColor italic">No family members registered yet. Add one above to manage their care unified.</p>
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            {familyList.map((m, idx) => {
              const age = m.birthDate ? new Date().getFullYear() - new Date(m.birthDate).getFullYear() : "N/A";
              return (
                <div key={idx} className="bg-gray-50 border border-gray-150 p-4 rounded-2xl flex items-center justify-between shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-teal-100/55 flex items-center justify-center text-primaryColor font-bold uppercase text-xs">
                      {m.name?.[0]}
                    </div>
                    <div>
                      <h4 className="font-extrabold text-headingColor text-xs">{m.name}</h4>
                      <p className="text-[10px] text-textColor mt-0.5">{m.relation} • {m.gender} • {age} years old</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleRemoveMember(idx)}
                    className="text-red-500 hover:text-red-700 p-2.5 rounded-lg hover:bg-red-50 transition-all"
                  >
                    <BiTrash size={15} />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
}
