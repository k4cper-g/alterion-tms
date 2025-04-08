"use client";

import { useState, useEffect, useRef, useCallback, memo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ArrowRight,
  DollarSign,
  X,
  Send,
  Loader2,
  Pin,
  Clock,
  Package,
  Ruler,
  Weight,
  ChevronUp,
  ChevronDown,
  Info,
  Check,
  Settings2,
  Bot,
  ChevronRight,
  PlayIcon,
  UserIcon,
  MailWarning,
  MessageCircleWarning
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { formatDistanceToNow, format } from "date-fns";
import { Id } from "../../../../../convex/_generated/dataModel";
import { useNegotiationModal } from "@/context/NegotiationModalContext";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
  DialogClose
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { toast } from "sonner";

// Add the helper function here, ideally move to utils later
const parseNumericValue = (str: string | null | undefined): number | null => {
  if (str === null || str === undefined) return null;
  try {
    const cleaned = str.replace(/[^\d.,]/g, '');
    const withoutCommas = cleaned.replace(/,/g, '');
    const value = parseFloat(withoutCommas);
    return isNaN(value) ? null : value;
  } catch (error) {
    console.error(`Error parsing numeric value from string "${str}":`, error);
    return null;
  }
};

// Define type for AgentSettingsModal props
interface AgentSettingsModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  negotiation: any; // Type this more specifically based on your actual negotiation object
  targetPricePerKm: string;
  setTargetPricePerKm: (value: string) => void;
  negotiationMode: "pricePerKm" | "percentage"; // Add negotiation mode
  setNegotiationMode: (mode: "pricePerKm" | "percentage") => void; // Add setter for mode
  targetPercentage: string; // Add target percentage field
  setTargetPercentage: (value: string) => void; // Add setter for percentage
  isConfiguringAgent: boolean;
  agentStyle: "conservative" | "balanced" | "aggressive";
  setAgentStyle: React.Dispatch<React.SetStateAction<"conservative" | "balanced" | "aggressive">>;
  notifyOnPriceIncrease: boolean;
  setNotifyOnPriceIncrease: (value: boolean) => void;
  notifyOnNewTerms: boolean;
  setNotifyOnNewTerms: (value: boolean) => void;
  notifyAfterRounds: number;
  setNotifyAfterRounds: (value: number) => void;
  maxAutoReplies: number;
  setMaxAutoReplies: (value: number) => void;
  handleToggleAgent: (enabled: boolean) => Promise<void>;
  calculateCurrentPricePerKm: () => string | null;
  calculateTargetPrice: () => string | null; // Add function to calculate total target price
}

// Extract the AgentSettingsModal component outside the main component
const AgentSettingsModal = memo(({
  isOpen,
  onOpenChange,
  negotiation,
  targetPricePerKm,
  setTargetPricePerKm,
  negotiationMode,
  setNegotiationMode,
  targetPercentage,
  setTargetPercentage,
  isConfiguringAgent,
  agentStyle,
  setAgentStyle,
  notifyOnPriceIncrease,
  setNotifyOnPriceIncrease,
  notifyOnNewTerms,
  setNotifyOnNewTerms,
  notifyAfterRounds,
  setNotifyAfterRounds,
  maxAutoReplies,
  setMaxAutoReplies,
  handleToggleAgent,
  calculateCurrentPricePerKm,
  calculateTargetPrice
}: AgentSettingsModalProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden">
        <DialogHeader className="px-6 pt-6 pb-2">
          <DialogTitle className="flex items-center text-xl">
            <Bot className="mr-2 h-5 w-5 text-primary" />
            AI Agent Settings
          </DialogTitle>
        </DialogHeader>
        
        <div className="px-6 py-4 overflow-y-auto max-h-[70vh]">
          <div className="space-y-6">
            {/* Main Settings */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-base font-medium">Enable AI Agent</Label>
                <Switch
                  checked={negotiation?.isAgentActive || false}
                  onCheckedChange={handleToggleAgent}
                  disabled={isConfiguringAgent || negotiation.status !== "pending"}
                />
              </div>
              
              {/* Price Target Section */}
              <div className="border-t pt-4 mt-2">
                <h3 className="font-medium mb-3">Target Price Settings</h3>
                
                {/* Toggle between price/km and percentage modes */}
                <div className="mb-4">
                  <Label className="block mb-2">Negotiation Mode</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <Button 
                      variant={negotiationMode === "pricePerKm" ? "default" : "outline"} 
                      size="sm"
                      onClick={() => setNegotiationMode("pricePerKm")}
                      disabled={negotiation.isAgentActive}
                      className="w-full"
                    >
                      Price per km
                    </Button>
                    <Button 
                      variant={negotiationMode === "percentage" ? "default" : "outline"} 
                      size="sm"
                      onClick={() => setNegotiationMode("percentage")}
                      disabled={negotiation.isAgentActive}
                      className="w-full"
                    >
                      Percentage
                    </Button>
                  </div>
                </div>
                
                <div className="space-y-3">
                  {negotiationMode === "pricePerKm" ? (
                    // Price per km input
                  <div className="space-y-1.5">
                    <Label htmlFor="modalTargetPrice">
                      Target Price per km (EUR/km)
                    </Label>
                    <div className="flex gap-2 items-center">
                      <Input
                        id="modalTargetPrice"
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="e.g. 1.25"
                        value={targetPricePerKm}
                        onChange={(e) => setTargetPricePerKm(e.target.value)}
                        disabled={isConfiguringAgent || (negotiation.isAgentActive && negotiation.status === "pending")}
                          className={cn(
                            "w-full",
                            targetPricePerKm && (isNaN(parseFloat(targetPricePerKm)) || parseFloat(targetPricePerKm) <= 0) && "border-red-500"
                          )}
                      />
                    </div>
                      {targetPricePerKm && (isNaN(parseFloat(targetPricePerKm)) || parseFloat(targetPricePerKm) <= 0) && (
                        <p className="text-xs text-red-500 mt-1">
                          Please enter a valid positive number
                        </p>
                      )}
                    {calculateCurrentPricePerKm() && (
                      <p className="text-xs text-muted-foreground">
                        Current: ~{calculateCurrentPricePerKm()} EUR/km
                      </p>
                    )}
                  </div>
                  ) : (
                    // Percentage input
                    <div className="space-y-1.5">
                      <Label htmlFor="targetPercentage">
                        Target Percentage (from initial price)
                      </Label>
                      <div className="flex gap-2 items-center">
                        <Input
                          id="targetPercentage"
                          type="number"
                          step="1"
                          min="-50"
                          max="50"
                          placeholder="e.g. -10 (10% below initial)"
                          value={targetPercentage}
                          onChange={(e) => setTargetPercentage(e.target.value)}
                          disabled={isConfiguringAgent || (negotiation.isAgentActive && negotiation.status === "pending")}
                          className={cn(
                            "w-full",
                            targetPercentage && (isNaN(parseFloat(targetPercentage))) && "border-red-500"
                          )}
                        />
                        <span className="text-lg">%</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Use negative values for discount (e.g. -10 means 10% below initial price)
                      </p>
                      {targetPercentage && isNaN(parseFloat(targetPercentage)) && (
                        <p className="text-xs text-red-500 mt-1">
                          Please enter a valid number
                        </p>
                      )}
                      {calculateTargetPrice() && (
                        <p className="text-xs font-medium text-primary mt-1">
                          Target price: {calculateTargetPrice()}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Negotiation Style Section */}
                  <div className="space-y-1.5 pt-2">
                    <Label className="block mb-2">Negotiation Style</Label>
                    <div className="grid grid-cols-3 gap-2">
                      <Button 
                        variant={agentStyle === "conservative" ? "default" : "outline"} 
                        size="sm"
                        onClick={() => setAgentStyle("conservative")}
                        disabled={negotiation.isAgentActive}
                        className="w-full"
                      >
                        Conservative
                      </Button>
                      <Button 
                        variant={agentStyle === "balanced" ? "default" : "outline"} 
                        size="sm"
                        onClick={() => setAgentStyle("balanced")}
                        disabled={negotiation.isAgentActive}
                        className="w-full"
                      >
                        Balanced
                      </Button>
                      <Button 
                        variant={agentStyle === "aggressive" ? "default" : "outline"} 
                        size="sm"
                        onClick={() => setAgentStyle("aggressive")}
                        disabled={negotiation.isAgentActive}
                        className="w-full"
                      >
                        Aggressive
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      {agentStyle === "conservative" ? "Cautious approach, prioritizes maintaining relationship." :
                       agentStyle === "balanced" ? "Balanced approach, seeks fair terms for both sides." :
                       "Assertive approach, focuses strongly on reaching target price."}
                    </p>
                  </div>
                </div>
              </div>
              
              {/* Notification Settings Section */}
              <div className="border-t pt-4 mt-2">
                <h3 className="font-medium mb-3">Notification Settings</h3>
                <div className="space-y-3">
                  <div className="bg-gray-50 p-3 rounded-md space-y-3">
                    <Label className="block">Notify me when:</Label>
                    
                    <div className="flex items-center justify-between mt-2">
                      <div className="space-y-1">
                        <span className="text-sm">Price increases (moves away from target)</span>
                        <p className="text-xs text-muted-foreground">Alert when the carrier proposes a higher price</p>
                      </div>
                      <Switch 
                        checked={notifyOnPriceIncrease} 
                        onCheckedChange={setNotifyOnPriceIncrease}
                        disabled={negotiation.isAgentActive}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between border-t border-gray-200 pt-3 mt-1">
                      <div className="space-y-1">
                        <span className="text-sm">New terms mentioned</span>
                        <p className="text-xs text-muted-foreground">Alert when carrier mentions terms not in the initial offer</p>
                      </div>
                      <Switch 
                        checked={notifyOnNewTerms} 
                        onCheckedChange={setNotifyOnNewTerms}
                        disabled={negotiation.isAgentActive}
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 mt-2">
                    <div className="space-y-1.5">
                      <Label htmlFor="maxRounds">
                        Maximum automatic replies
                      </Label>
                      <Select 
                        disabled={negotiation.isAgentActive}
                        value={maxAutoReplies.toString()}
                        onValueChange={(value) => setMaxAutoReplies(parseInt(value))}
                      >
                        <SelectTrigger className="w-full" id="maxRounds">
                          <SelectValue placeholder="Select max replies" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1">1 reply</SelectItem>
                          <SelectItem value="2">2 replies</SelectItem>
                          <SelectItem value="3">3 replies</SelectItem>
                          <SelectItem value="5">5 replies</SelectItem>
                          <SelectItem value="10">10 replies</SelectItem>
                          <SelectItem value="999">Unlimited</SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground">
                        Agent will notify you after this many exchanges
                      </p>
                    </div>
                    
                    <div className="space-y-1.5">
                      <Label>Notify after rounds</Label>
                      <div className="flex items-center mt-2 gap-2">
                        <Button 
                          variant="outline" 
                          size="icon"
                          onClick={() => setNotifyAfterRounds(Math.max(1, notifyAfterRounds - 1))}
                          disabled={negotiation.isAgentActive || notifyAfterRounds <= 1}
                        >
                          <ChevronDown className="h-4 w-4" />
                        </Button>
                        <div className="border rounded-md text-center py-2 flex-1">
                          {notifyAfterRounds}
                        </div>
                        <Button 
                          variant="outline" 
                          size="icon"
                          onClick={() => setNotifyAfterRounds(notifyAfterRounds + 1)}
                          disabled={negotiation.isAgentActive}
                        >
                          <ChevronUp className="h-4 w-4" />
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Rounds of negotiation before notification
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <DialogFooter className="bg-gray-50 px-6 py-4">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          {!negotiation.isAgentActive && (
            <Button 
              type="button" 
              onClick={() => handleToggleAgent(true)}
              disabled={isConfiguringAgent || 
                (negotiationMode === "pricePerKm" 
                  ? (!targetPricePerKm || isNaN(parseFloat(targetPricePerKm)) || parseFloat(targetPricePerKm) <= 0)
                  : (!targetPercentage || isNaN(parseFloat(targetPercentage))))
              }
            >
              {isConfiguringAgent ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Bot className="mr-2 h-4 w-4" />
              )}
              {negotiationMode === "pricePerKm" 
                ? "Activate Agent with Target Price" 
                : "Activate Agent with Target Percentage"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
});

export default function NegotiationDetailClient({ 
  negotiationId 
}: { 
  negotiationId: Id<"negotiations">
}) {
  // --- ALL HOOK CALLS MUST BE AT THE TOP LEVEL --- 
  const [message, setMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [detailsExpanded, setDetailsExpanded] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { openNegotiation } = useNegotiationModal();
  
  // Fetch negotiation data
  const negotiation = useQuery(api.negotiations.getNegotiationById, { 
    negotiationId 
  });
  
  // State for settings dialog
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [subjectInput, setSubjectInput] = useState('');
  const [ccInput, setCcInput] = useState('');
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  
  // AI Agent States
  const [targetPricePerKm, setTargetPricePerKm] = useState("");
  const [negotiationMode, setNegotiationMode] = useState<"pricePerKm" | "percentage">("pricePerKm");
  const [targetPercentage, setTargetPercentage] = useState("");
  const [agentStyle, setAgentStyle] = useState<"conservative" | "balanced" | "aggressive">("balanced");
  const [notifyOnPriceIncrease, setNotifyOnPriceIncrease] = useState(true);
  const [notifyOnNewTerms, setNotifyOnNewTerms] = useState(true);
  const [maxAutoReplies, setMaxAutoReplies] = useState(3);
  const [notifyAfterRounds, setNotifyAfterRounds] = useState(5);
  const [isAgentSettingsOpen, setIsAgentSettingsOpen] = useState(false);
  const [isConfiguringAgent, setIsConfiguringAgent] = useState(false);
  
  // Get mutations
  const addMessage = useMutation(api.negotiations.addMessage);
  const updateNegotiationStatus = useMutation(api.negotiations.updateNegotiationStatus);
  const updateEmailSettings = useMutation(api.negotiations.updateEmailSettings);
  const configureAgent = useMutation(api.negotiations.configureAgent);
  const resumeAgentMutation = useMutation(api.negotiations.resumeAgent);
  
  // Function for extracting a numeric value from a price string
  const parseNumericPrice = useCallback((priceStr: string | null | undefined): number | null => {
    if (!priceStr) return null;
    const numericString = priceStr.replace(/[^0-9.,]/g, '').replace(',', '.');
    const numeric = parseFloat(numericString);
    return !isNaN(numeric) ? numeric : null;
  }, []);
  
  // USE negotiation.currentPrice directly from the database where needed
  const currentPrice = negotiation?.currentPrice; // This can be string | undefined

  // Function to calculate target price based on percentage
  const calculateTargetPrice = useCallback(() => {
    if (!negotiation || negotiationMode !== "percentage" || !targetPercentage || isNaN(parseFloat(targetPercentage))) {
        return null;
      }

    // Get initial price
    const initialPriceStr = negotiation.initialRequest.price;
    const initialPrice = parseNumericPrice(initialPriceStr);
    
    if (!initialPrice) return null;
    
    // Calculate target price based on percentage
    const percentageValue = parseFloat(targetPercentage);
    const multiplier = 1 + (percentageValue / 100);
    const targetPrice = initialPrice * multiplier;
    
    // Format with proper currency symbol
    return `€${targetPrice.toFixed(2)}`;
  }, [negotiation, negotiationMode, targetPercentage, parseNumericPrice]);

  // Function to calculate the current price per kilometer
  const calculateCurrentPricePerKm = useCallback(() => {
    if (!negotiation || !currentPrice) return null; // Use the direct currentPrice
    
    // Extract distance from the negotiation details
    const distanceStr = negotiation.initialRequest.distance;
    if (!distanceStr) return null;
    
    // Extract the numeric part of the distance (e.g. "150 km" -> 150)
    const distanceMatch = distanceStr.match(/(\d+(?:[.,]\d+)?)/);
    if (!distanceMatch) return null;
    
    const distance = parseFloat(distanceMatch[1].replace(',', '.'));
    if (isNaN(distance) || distance === 0) return null;
    
    // Extract the numeric part of the current price
    const priceNum = parseNumericPrice(currentPrice);
    if (priceNum === null) return null;
    
    // Calculate and format the price per km
    const pricePerKm = priceNum / distance;
    return pricePerKm.toFixed(2);
  }, [negotiation, currentPrice, parseNumericPrice]);
  
  // Create a stable callback for handling modal toggle (memoized)
  const handleOpenAgentSettings = useCallback((open: boolean) => {
    setIsAgentSettingsOpen(open);
  }, []);
  
  // Handle sending a message (memoized)
  const handleSendMessage = useCallback(async () => {
    if (!message.trim() || !negotiation) return;
    
    setIsSending(true);
    try {
      await addMessage({
        negotiationId,
        message: message.trim(),
        sender: "user", // This is the current user
      });
      setMessage("");
    } catch (error) {
      console.error("Error sending message:", error);
    } finally {
      setIsSending(false);
    }
  }, [message, addMessage, negotiationId, negotiation]);
  
  // Handle accepting or rejecting an offer (memoized)
  const handleUpdateStatus = useCallback(async (status: string) => {
    if (!negotiation) return;
    try {
      await updateNegotiationStatus({
        negotiationId,
        status,
      });
    } catch (error) {
      console.error("Error updating status:", error);
    }
  }, [negotiationId, updateNegotiationStatus, negotiation]);

  // Handle saving email settings (memoized)
  const handleSaveSettings = useCallback(async () => {
    if (!negotiation) return;
    setIsSavingSettings(true);
    try {
      const parsedCcArray = ccInput
        .split(',')
        .map(e => e.trim())
        .filter(e => e && e.includes('@')); // Basic filter for non-empty and containing @

      await updateEmailSettings({
        negotiationId: negotiation._id,
        subject: subjectInput.trim() === '' ? undefined : subjectInput.trim(), // Send undefined if empty
        ccRecipients: parsedCcArray,
      });
      // Optionally add toast notification for success
      setIsSettingsOpen(false); // Close dialog on success
    } catch (error) {
      console.error("Failed to save email settings:", error);
      // Optionally add toast notification for error
    } finally {
      setIsSavingSettings(false);
    }
  }, [negotiation, ccInput, subjectInput, updateEmailSettings]);
  
  // Handle toggling the AI agent
  const handleToggleAgent = useCallback(async (enabled: boolean) => {
    if (!negotiation) return;
    
    setIsConfiguringAgent(true);
    
    try {
      if (enabled) {
        // Validation
        if (negotiationMode === "pricePerKm") {
          // Validate price per km
          if (!targetPricePerKm || isNaN(parseFloat(targetPricePerKm)) || parseFloat(targetPricePerKm) <= 0) {
            toast.error("Invalid target price", {
              description: "Please enter a valid target price per kilometer."
            });
            return;
          }
          
          // Convert to number for the API
          const numericTarget = parseFloat(targetPricePerKm.replace(',', '.'));
          
          // Configure agent with price per km target
          await configureAgent({
            negotiationId: negotiation._id,
            isActive: true,
            targetPricePerKm: numericTarget,
            agentSettings: {
              style: agentStyle,
              notifyOnPriceIncrease,
              notifyOnNewTerms,
              maxAutoReplies,
              notifyAfterRounds
            }
          });
          
          // Show success notification
          toast.success("AI Agent enabled", {
            description: `Target price: ${numericTarget.toFixed(2)} EUR/km (${agentStyle} approach)`
          });
        } else {
          // Percentage-based negotiation
          if (!targetPercentage || isNaN(parseFloat(targetPercentage))) {
            toast.error("Invalid percentage", {
              description: "Please enter a valid percentage value."
            });
            return;
          }
          
          // Calculate the target price per km based on percentage
          const initialPriceStr = negotiation.initialRequest.price;
          const initialPrice = parseNumericPrice(initialPriceStr);
          const distanceStr = negotiation.initialRequest.distance;
          
          if (!initialPrice || !distanceStr) {
            toast.error("Missing information", {
              description: "Initial price or distance is missing or invalid."
            });
            return;
          }
          
          // Extract distance value
          const distanceMatch = distanceStr.match(/(\d+(?:[.,]\d+)?)/);
          if (!distanceMatch) {
            toast.error("Invalid distance format", {
              description: "Could not extract numeric distance value."
            });
            return;
          }
          
          const distance = parseFloat(distanceMatch[1].replace(',', '.'));
          if (isNaN(distance) || distance === 0) {
            toast.error("Invalid distance", {
              description: "Distance must be a positive number."
            });
            return;
          }
          
          // Calculate target price per km based on percentage adjustment
          const percentageValue = parseFloat(targetPercentage);
          const multiplier = 1 + (percentageValue / 100);
          const targetTotalPrice = initialPrice * multiplier;
          
          // Round to 2 decimal places
          const targetPricePerKmValue = parseFloat((targetTotalPrice / distance).toFixed(2));
          
          // Configure agent with the calculated price per km
          await configureAgent({
            negotiationId: negotiation._id,
            isActive: true,
            targetPricePerKm: targetPricePerKmValue,
            agentSettings: {
              style: agentStyle,
              notifyOnPriceIncrease,
              notifyOnNewTerms,
              maxAutoReplies,
              notifyAfterRounds
            }
          });
          
          // Show success notification with both percentage and calculated price
          toast.success("AI Agent enabled", {
            description: `Target: ${percentageValue > 0 ? '+' : ''}${percentageValue}% (${targetPricePerKmValue.toFixed(2)} EUR/km)`
          });
        }
        
        // Close settings dialog after activation
        setIsAgentSettingsOpen(false);
      } else {
        // Disable agent
        await configureAgent({
          negotiationId: negotiation._id,
          isActive: false
        });
        
        toast.info("AI Agent disabled", {
          description: "You're now in manual negotiation mode."
        });
      }
    } catch (error) {
      console.error("Error configuring agent:", error);
      toast.error("Failed to configure AI agent", {
        description: error instanceof Error ? error.message : "An unknown error occurred"
      });
    } finally {
      setIsConfiguringAgent(false);
    }
  }, [
    negotiation, 
    targetPricePerKm,
    negotiationMode,
    targetPercentage, 
    configureAgent, 
    agentStyle, 
    notifyOnPriceIncrease, 
    notifyOnNewTerms, 
    maxAutoReplies, 
    notifyAfterRounds, 
    isAgentSettingsOpen,
    parseNumericPrice
  ]);
  
  // Handle resuming agent (memoized)
  const handleResumeAgent = useCallback(async (action: "continue" | "take_over") => {
    if (!negotiation?._id) return;
    
    try {
      // Check if this is a target price reached notification and handle accordingly
      const isTargetPriceReached = negotiation.agentMessage && 
        (negotiation.agentMessage.includes("meets or beats your target price") || 
         negotiation.agentMessage.includes("meets or exceeds your target price") ||
         negotiation.agentMessage.includes("agreed to your offered price"));
      
      if (isTargetPriceReached) {
        if (action === "continue") {
          // "Accept" was clicked - update negotiation status to accepted
          await updateNegotiationStatus({
            negotiationId: negotiation._id,
            status: "accepted",
          });
          
          // Add a system message to record the acceptance
          await addMessage({
            negotiationId: negotiation._id,
            message: `The negotiation has been accepted at ${currentPrice || 'the agreed price'}.`, // Use direct currentPrice
            sender: "system",
          });
          
          toast.success("Offer accepted", {
            description: `You've accepted the price of ${currentPrice || 'the agreed price'}.` // Use direct currentPrice
          });
          
          // We don't need to resume the agent in this case
          return;
        } else if (action === "take_over") {
          // "Decline" was clicked - reject the current price but keep negotiating
          await addMessage({
            negotiationId: negotiation._id,
            message: `The offer at ${currentPrice || 'the current price'} was declined.`, // Use direct currentPrice
            sender: "system",
          });
          
          toast("Offer declined", {
            description: "The current price was declined. You've taken over the negotiation."
          });
          
          // Deactivate the agent since we're taking over after declining
          await configureAgent({
            negotiationId: negotiation._id,
            isActive: false
          });
          
          return;
        }
      }
      
      // Default behavior for non-target-price notifications
      await resumeAgentMutation({
        negotiationId: negotiation._id,
        action
      });
      
      toast(
        action === "continue" 
          ? "AI agent is continuing the negotiation" 
          : "You've taken over this negotiation",
        {
          description: action === "continue"
            ? "The AI will respond to the next message from the other party."
            : "The AI has been disabled. You can re-enable it later if needed."
        }
      );
    } catch (error) {
      console.error("Error processing action:", error);
      toast.error("Error processing your request", {
        description: "There was a problem with your request. Please try again."
      });
    }
  }, [negotiation, resumeAgentMutation, updateNegotiationStatus, addMessage, currentPrice, configureAgent]);

  // --- EFFECTS (continued) ---

  // Scroll to bottom when messages change
  useEffect(() => {
    if (negotiation && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [negotiation?.messages]);
  
  // Effect to initialize dialog and agent state when negotiation data loads/changes
  useEffect(() => {
    if (negotiation) {
      // Initialize Email settings
      setSubjectInput(negotiation.emailSubject || '');
      setCcInput(negotiation.emailCcRecipients?.join(', ') || '');
      
      // Initialize AI Agent settings 
      if (negotiation.agentTargetPricePerKm) {
        setTargetPricePerKm(String(negotiation.agentTargetPricePerKm).replace(',', '.'));
      } else {
        setTargetPricePerKm(''); 
      }
      
      // Load or reset advanced settings
      const agentSettings = (negotiation as any)?.agentSettings;
      if (agentSettings) {
        setAgentStyle(agentSettings.style || "balanced");
        setNotifyOnPriceIncrease(agentSettings.notifyOnPriceIncrease !== false); 
        setNotifyOnNewTerms(agentSettings.notifyOnNewTerms !== false); 
        setNotifyAfterRounds(agentSettings.notifyAfterRounds || 5); 
        setMaxAutoReplies(agentSettings.maxAutoReplies || 3); 
      } else {
        setAgentStyle("balanced");
        setNotifyOnPriceIncrease(true);
        setNotifyOnNewTerms(true);
        setNotifyAfterRounds(5);
        setMaxAutoReplies(3);
      }
    } else {
      // Reset state if negotiation becomes null (safer than the previous version)
      setSubjectInput('');
      setCcInput('');
      setTargetPricePerKm('');
      setAgentStyle("balanced");
      setNotifyOnPriceIncrease(true);
      setNotifyOnNewTerms(true);
      setNotifyAfterRounds(5);
      setMaxAutoReplies(3);
    }
  }, [negotiation]); // Re-run only when negotiation data changes

  // --- CALCULATIONS (Can safely use negotiation data now) ---
  
  // Calculate savings (safely handling nulls)
  const initialNumeric = parseNumericPrice(negotiation?.initialRequest?.price) || 0;
  const currentNumeric = parseNumericPrice(currentPrice) || 0; // Use direct currentPrice
  let savings = 0;
  let savingsPercentage = 0;
  
  if (initialNumeric > 0 && currentNumeric > 0 && initialNumeric > currentNumeric) {
    savings = initialNumeric - currentNumeric;
    savingsPercentage = (savings / initialNumeric) * 100;
  }

  // --- CONDITIONAL RETURN (Now safe, after all hooks) --- 
  if (!negotiation) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">Loading negotiation details...</p>
      </div>
    );
  }

  // --- RETURN JSX --- 
  return (
    <div className="flex flex-col h-full max-h-[calc(100vh-var(--header-height))] overflow-hidden bg-gray-50">
      {/* Header with key info and actions */}
      <div className="border-b bg-white py-3 px-4 sm:px-6 sticky top-0 z-10 flex-shrink-0">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 max-w-full mx-auto">
          {/* Left side: Title and Status */}
          <div className="flex items-center gap-x-3 min-w-0">
            <div className="flex flex-col min-w-0">
              <h1 className="text-lg font-semibold tracking-tight truncate flex items-center" title={`${negotiation.initialRequest.origin} to ${negotiation.initialRequest.destination}`}>
                {negotiation.initialRequest.origin}
                <ArrowRight className="inline-block h-4 w-4 mx-1.5 text-muted-foreground flex-shrink-0" />
                {negotiation.initialRequest.destination}
              </h1>
              <p className="text-xs text-muted-foreground truncate" title={`Negotiation ID: ${negotiationId}`}>
                ID: {negotiationId.toString().substring(0, 12)}...
              </p>
            </div>
            <Badge
              variant={
                negotiation.status === "pending" ? "secondary" :
                  negotiation.status === "accepted" ? "default" :
                negotiation.status === "rejected" ? "destructive" :
                "outline"
              }
              className="px-2.5 py-1 text-xs font-medium rounded-full flex-shrink-0"
            >
              {negotiation.status === "pending" ? "Active" :
               negotiation.status.charAt(0).toUpperCase() + negotiation.status.slice(1)}
            </Badge>
          </div>

          {/* Right side: Action Buttons */}
          <div className="flex items-center gap-2 mt-2 sm:mt-0 flex-shrink-0 justify-end">
            <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
              <DialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-foreground"
                  title="Email Settings"
                >
                  <Settings2 className="h-4 w-4" />
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Email Settings</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="subject" className="text-right col-span-1">
                      Subject
                    </Label>
                    <Input
                      id="subject"
                      value={subjectInput}
                      onChange={(e) => setSubjectInput(e.target.value)}
                      placeholder="Default subject will be used if empty"
                      className="col-span-3"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="cc" className="text-right col-span-1">
                      CC
                    </Label>
                    <Input
                      id="cc"
                      value={ccInput}
                      onChange={(e) => setCcInput(e.target.value)}
                      placeholder="Comma-separated emails"
                      className="col-span-3"
                    />
                  </div>
                </div>
                <DialogFooter>
                   <DialogClose asChild>
                      <Button type="button" variant="outline">
                        Cancel
                      </Button>
                    </DialogClose>
                  <Button 
                    type="button" 
                    onClick={handleSaveSettings}
                    disabled={isSavingSettings}
                  >
                    {isSavingSettings && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Save Changes
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            <Button
              variant="ghost"
              size="sm"
              className="gap-1 h-8 text-muted-foreground hover:text-foreground"
              onClick={() => openNegotiation(negotiationId)}
              title="Open as floating chat"
            >
              <Pin className="h-4 w-4" />
              <span className="hidden sm:inline">Detach</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="text-destructive border-destructive/50 hover:bg-destructive/5 hover:text-destructive gap-1 h-8"
              onClick={() => handleUpdateStatus("rejected")}
              disabled={negotiation.status !== "pending"}
              title="Reject Offer"
            >
              <X className="h-4 w-4" />
              <span className="hidden sm:inline">Reject</span>
            </Button>
            <Button
              size="sm"
              className="gap-1 h-8"
              onClick={() => handleUpdateStatus("accepted")}
              disabled={negotiation.status !== "pending"}
              title="Accept Offer"
            >
              <Check className="h-4 w-4" />
              <span className="hidden sm:inline">Accept</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 min-h-0 overflow-hidden">
        <div className="h-full flex flex-col md:flex-row">
          {/* Main chat section */}
          <div className="flex-1 flex flex-col h-full min-h-0 overflow-hidden order-2 md:order-1">
            {/* Chat history */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              <div className="max-w-[900px] mx-auto space-y-4">
                {/* Initial negotiation message - System Message Style */}
                <div className="text-center text-xs text-muted-foreground my-4">
                  <p className="inline-block bg-gray-200 rounded-full px-3 py-1">
                    Negotiation started on {format(new Date(negotiation.createdAt), "PP")} for{' '}
                    <span className="font-medium">{negotiation.initialRequest.origin} to {negotiation.initialRequest.destination}</span>
                    {' '}at <span className="font-medium">{negotiation.initialRequest.price}</span>.
                  </p>
                  {negotiation.initialRequest.notes && (
                     <p className="mt-2 italic text-gray-600 max-w-md mx-auto">
                        Initial Notes: {negotiation.initialRequest.notes}
                     </p>
                  )}
                </div>

                {/* Combine Messages and Offers into a single chronological feed */}
                {[
                  ...(negotiation.counterOffers || []),
                  ...(negotiation.messages || [])
                ]
                .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
                .filter(item => !('content' in item && item.sender === "system")) // Filter out system messages
                .map((item, index) => {
                  // Determine if the item is a message or an offer
                  const isMessage = 'content' in item;
                  const timestamp = new Date(item.timestamp);

                  if (isMessage) {
                    // --- Message Rendering ---
                    const messageItem = item as typeof negotiation.messages[0]; // Type assertion
                    const isUser = messageItem.sender === "user"; // Assuming 'user' represents the current user viewing
                    const isAgent = messageItem.sender === "agent";
                    
                    // Group both user and agent messages to the right side
                    const isSenderSideRight = isUser || isAgent;
                    
                    // Extract sender name for display
                    let senderName = "";
                    if (isUser) {
                      senderName = "You";
                    } else if (isAgent) {
                      senderName = "AI Agent";
                    } else {
                      // Extract name from email if the format is "Email: email@example.com"
                      const emailMatch = messageItem.sender.match(/Email: (.*)/);
                      if (emailMatch && emailMatch[1]) {
                        // Extract everything before the @ symbol
                        const atIndex = emailMatch[1].indexOf('@');
                        senderName = atIndex > 0 ? emailMatch[1].substring(0, atIndex) : emailMatch[1];
                      } else {
                        senderName = messageItem.sender;
                      }
                    }

                    return (
                      <div
                        key={`msg-${index}`}
                        className={cn("flex", isSenderSideRight ? "justify-end" : "justify-start")}
                      >
                        <div className="flex flex-col max-w-[75%]">
                          {/* Sender name */}
                          <span className={cn(
                            "text-xs mb-1 px-1 font-medium",
                            isSenderSideRight ? "text-right" : "text-left",
                            isUser ? "text-blue-600" : 
                            isAgent ? "text-emerald-600" : "text-gray-600"
                          )}>
                            {isAgent && <Bot className="h-3 w-3 inline mr-1 mb-0.5" />}
                            {senderName}
                          </span>
                          
                          {/* Message bubble */}
                        <div
                          className={cn(
                              "rounded-lg px-3 py-2 shadow-sm", // Base bubble style
                            isUser
                              ? "bg-blue-500 text-white" // User bubble style
                                : isAgent
                                  ? "bg-emerald-500 text-white" // Agent bubble style
                              : "bg-white border" // Carrier/Other bubble style
                          )}
                        >
                          <p className="text-sm">{messageItem.content}</p>
                          <p className={cn(
                              "text-xs mt-1 text-right", // Timestamp style
                                isUser ? "text-blue-200" : isAgent ? "text-emerald-200" : "text-muted-foreground"
                            )}
                            title={format(timestamp, "PPpp")} // Show full date on hover
                          >
                             {formatDistanceToNow(timestamp, { addSuffix: true })}
                          </p>
                          </div>
                        </div>
                      </div>
                    );
                  } else {
                     // --- Counter Offer Rendering ---
                    const offerItem = item as typeof negotiation.counterOffers[0]; // Type assertion
                    const isUserProposal = offerItem.proposedBy === "user";

                    return (
                      <div key={`offer-${index}`} className="text-center text-xs text-muted-foreground my-4">
                         <div className={cn(
                           "inline-block border rounded-lg px-4 py-2 text-left max-w-md mx-auto shadow-sm", // Offer block style
                            isUserProposal ? "border-blue-200 bg-blue-50" : "border-amber-200 bg-amber-50"
                         )}>
                          <div className="flex justify-between items-center mb-1">
                             <span className={cn(
                                 "font-semibold text-sm",
                                 isUserProposal ? "text-blue-700" : "text-amber-800"
                               )}>
                                {isUserProposal ? "Your Proposal" : "Carrier Proposal"}
                             </span>
                             <span className="text-xs text-muted-foreground" title={format(timestamp, "PPpp")}>
                                {formatDistanceToNow(timestamp, { addSuffix: true })}
                             </span>
                          </div>
                           <p className="text-base font-semibold text-gray-800 mb-1">{offerItem.price}</p>
                           {offerItem.notes && <p className="text-sm text-gray-600 italic mt-1">{offerItem.notes}</p>}
                           {offerItem.status !== 'pending' && (
                             <Badge
                                variant={
                                  offerItem.status === "accepted" ? "default" :
                                  offerItem.status === "rejected" ? "destructive" :
                                  "outline"
                                }
                                className="mt-2 text-xs"
                              >
                                {offerItem.status.charAt(0).toUpperCase() + offerItem.status.slice(1)}
                              </Badge>
                           )}
                         </div>
                       </div>
                    );
                  }
                })}
                
                {/* Agent typing indicator */}
                {/* {negotiation.isAgentActive && negotiation.agentStatus === "negotiating" && (
                  <div className="flex justify-center  my-3">
                    <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 text-sm max-w-lg  w-full shadow-sm">
                      <div className="flex items-center gap-3">
                        <div className="bg-emerald-100 rounded-full p-2 mt-0.5">
                          <Bot className="h-5 w-5 text-emerald-600" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center">
                            <p className="font-semibold text-emerald-800 text-sm mr-2">AI Agent is monitoring conversation</p>
                            <span className="flex space-x-1">
                              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" style={{ animationDuration: "1.5s" }}></span>
                              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" style={{ animationDuration: "1.5s", animationDelay: "0.3s" }}></span>
                              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" style={{ animationDuration: "1.5s", animationDelay: "0.6s" }}></span>
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )} */}
                
                {/* Needs review notification */}
                {negotiation.isAgentActive && negotiation.agentState === "needs_review" && (
                  <div className="flex justify-center my-3">
                    <div className=" border  rounded-xl px-4 py-3 text-sm max-w-md w-full shadow-sm">
                      <div className="flex items-center justify-center gap-3">
                        {/* <div className="bg-amber-100 rounded-full p-2 mt-0.5">
                          <Info className="h-5 w-5 text-amber-600" />
        
                        </div> */}
                        <div className="flex-1 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <Info className="h-5 w-5 " />
                            {negotiation.agentMessage && negotiation.agentMessage.includes("meets or beats your target price") ? (
                              <p className="font-semibold text-sm">Target price reached</p>
                            ) : (
                              <p className="font-semibold text-sm">Review needed</p>
                            )}
                          </div>
                          <p className="text-sm mt-1 mb-3">
                            {negotiation.agentMessage && negotiation.agentMessage.includes("meets or beats your target price") ? (
                              "The agent has reached your target price. Do you want to accept the offer?"
                            ) : (
                              negotiation.agentMessage 
                                ? `The agent has paused and needs your decision on how to proceed. Reason: ${negotiation.agentMessage}`
                                : "The agent has paused and needs your decision on how to proceed."
                            )}
                          </p>
                          <div className="flex gap-2 justify-center">
                            <Button
                              size="sm"
                              className={
                                negotiation.agentMessage && negotiation.agentMessage.includes("meets or beats your target price") 
                                ? "text-xs h-8 bg-green-600 hover:bg-green-700" 
                                : "text-xs h-8"
                              }
                              onClick={() => handleResumeAgent("continue")}
                            >
                              {negotiation.agentMessage && negotiation.agentMessage.includes("meets or beats your target price") 
                                ? "Accept" 
                                : "Continue"
                              }
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="border-blue-200 text-xs h-8"
                              onClick={() => handleResumeAgent("take_over")}
                            >
                              {negotiation.agentMessage && negotiation.agentMessage.includes("meets or beats your target price") 
                                ? "Decline" 
                                : "Take over"
                              }
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Agent error notification - MOVED HERE FROM INPUT AREA */}
                {negotiation.isAgentActive && negotiation.agentState === "error" && (
                  <div className="flex justify-center my-3">
                    <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm max-w-xl w-full shadow-sm">
                      <div className="flex items-start gap-3">
                        <div className="bg-red-100 rounded-full p-2 mt-0.5">
                          <Bot className="h-5 w-5 text-red-600" />
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold text-red-800 text-sm">AI Agent encountered an error</p>
                          <p className="text-sm text-red-700 mt-1 mb-3">
                            There was a problem with the AI agent. You may need to deactivate and reactivate it, or continue negotiating manually.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Scroll anchor */}
                <div ref={messagesEndRef} />
              </div>
            </div>
            
            {/* Message input section */}
            <div className="border-t bg-gray-100 p-3 sm:p-4 sticky bottom-0 z-10 flex-shrink-0">
              <div className="flex items-start space-x-3 max-w-[900px] mx-auto">
                <Textarea
                  placeholder={
                    negotiation.status !== "pending" 
                      ? `Cannot send messages: Negotiation is ${negotiation.status}.`
                      : "Type your message or offer details..."
                  }
                  className="flex-1 min-h-[40px] max-h-[150px] sm:min-h-[44px] resize-none bg-white border-gray-300 rounded-lg shadow-sm focus:border-primary focus:ring-1 focus:ring-primary disabled:bg-gray-100 disabled:cursor-not-allowed"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  disabled={negotiation.status !== "pending"}
                />
                <Button
                  size="icon"
                  onClick={handleSendMessage}
                  disabled={negotiation.status !== "pending" || isSending || !message.trim()}
                  className="h-10 w-10 flex-shrink-0 rounded-lg"
                  title="Send Message"
                >
                  {isSending ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <Send className="h-5 w-5" />
                  )}
                </Button>
              </div>
              {negotiation.status !== "pending" && (
                  <p className="text-xs text-muted-foreground mt-1 text-center sm:text-left max-w-[900px] mx-auto">
                  This negotiation is {negotiation.status}. You cannot send new messages.
                </p>
              )}
            </div>
          </div>
          
          {/* Details section (non-collapsible) */}
          <div className="w-full md:w-[320px] lg:w-[360px] flex-shrink-0 border-l bg-white overflow-y-auto order-1 md:order-2">
            <Card className="shadow-none border-0 rounded-none h-full flex flex-col">
               {/* REMOVED Collapse Toggle Header */}

              {/* Content Area */}
              <CardContent className="p-4 flex-1 overflow-y-auto text-sm space-y-6">
                
                {/* AI Agent Section - MOVED TO TOP */}
                {negotiation && (
                    <div className="border rounded-lg overflow-hidden">
                        {/* ... existing AI Agent JSX ... */}
          <div className={cn(
                        "p-3 flex items-center justify-between",
                      "bg-gray-50 border-b border-gray-100" 
               
                        )}>
                        <div className="flex items-center gap-2">
                            <div className={cn(
                            "rounded-full p-1.5","bg-gray-100"
                            )}>
                            <Bot className={cn(
                                "h-4 w-4",
                          "text-black-500"
                            )} />
                            </div>
                            <h3 className="font-medium text-sm">AI Negotiation Agent</h3>
                        </div>
                        
                        <Switch
                            checked={negotiation?.isAgentActive || false}
                            onCheckedChange={handleToggleAgent}
                            disabled={isConfiguringAgent || negotiation.status !== "pending"}
                            className={cn(
                            "data-[state=checked]:bg-primary"
                            )}
                        />
                        </div>
                        
                        {/* Agent Content - Active */}
                        {negotiation.isAgentActive && (
                        <div className="p-3 space-y-3">
                            {/* Status Card */}
                            <div className={cn(
                            "rounded-md p-2 flex items-start gap-2.5",
                            negotiation.agentState === "needs_review" ? "bg-amber-50"
                            : negotiation.agentState === "error" ? "bg-red-50"
                            : "bg-green-50" // Default to green when undefined (actively negotiating)
                            )}>
                            <div className={cn(
                                "mt-0.5 rounded-full p-1",
                                negotiation.agentState === "needs_review" 
                                    ? "bg-amber-100 text-amber-600"
                                    : negotiation.agentState === "error"
                                        ? "bg-red-100 text-red-600"
                                        : "bg-green-100 text-green-600" // Default when undefined
                            )}>
                                {negotiation.agentState === "needs_review" 
                                ? <Info className="h-3 w-3" />
                                : negotiation.agentState === "error"
                                    ? <X className="h-3 w-3" />
                                    : <Bot className="h-3 w-3" /> // Default when undefined
                                }
                            </div>
                            
                            <div className="flex-1 min-w-0">
                                <p className={cn(
                                "text-sm font-medium",
                                negotiation.agentState === "needs_review" ? "text-amber-800"
                                : negotiation.agentState === "error" ? "text-red-800"
                                : "text-green-800" // Default when undefined
                                )}>
                                {negotiation.agentState === "needs_review" ? "Needs Your Review"
                                : negotiation.agentState === "error" ? "Agent Error"
                                : "Actively Negotiating"} {/* Default when undefined */}
                                </p>
                                <p className="text-xs mt-0.5 text-muted-foreground line-clamp-2">
                                {negotiation.agentState === "needs_review" 
                                    ? "The agent has paused and needs your decision on how to proceed."
                                    : negotiation.agentState === "error" 
                                    ? "The agent encountered an error. You may need to reconfigure it."
                                    : "The AI agent is working to reach your target price."} {/* Default when undefined */}
                                </p>
                            </div>
                            </div>
                            
                    
                            {/* Agent Settings Card */}
                            <div className="space-y-3 border rounded-md p-2.5">
                            {/* Target Price */}
                            {negotiation.agentTargetPricePerKm && (
                                <div className="flex justify-between items-center">
                                <span className="text-sm text-muted-foreground">Target price:</span>
                                <Badge variant="outline" className="font-mono bg-white">
                                    {typeof negotiation.agentTargetPricePerKm === 'number' 
                                      ? negotiation.agentTargetPricePerKm.toFixed(2) 
                                      : negotiation.agentTargetPricePerKm} EUR/km
                                </Badge>
                                </div>
                            )}
                            
                            {/* Current Price */}
                            {calculateCurrentPricePerKm() && (
                                <div className="flex justify-between items-center">
                                <span className="text-sm text-muted-foreground">Current price:</span>
                                <Badge 
                                    variant="outline" 
                                    className={cn(
                                    "font-mono bg-white",
                                    calculateCurrentPricePerKm() && negotiation.agentTargetPricePerKm && 
                                    parseFloat(calculateCurrentPricePerKm() || "0") <= parseFloat(negotiation.agentTargetPricePerKm.toString())
                                        ? "text-green-600 border-green-200"
                                        : "text-amber-600 border-amber-200"
                                    )}
                                >
                                    {calculateCurrentPricePerKm()} EUR/km
                                </Badge>
                                </div>
                            )}
                            
                            {/* Style */}
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-muted-foreground">Negotiation style:</span>
                                <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100">
                                {agentStyle}
                                </span>
                            </div>
                
                            
                            <Button 
                                variant="outline" 
                                size="sm" 
                                className="w-full h-8 mt-1 border-gray-200"
                                onClick={() => handleOpenAgentSettings(true)}
                            >
                                <Settings2 className="h-3 w-3 mr-1.5" />
                                Configure Agent
                            </Button>
                            </div>
                        </div>
                        )}
                        
                        {/* Agent Content - Inactive */}
                        {!negotiation.isAgentActive && (
                        <div className="p-3 space-y-3">
                            <p className="text-sm text-muted-foreground">
                            Let AI negotiate on your behalf to reach your target price.
                            </p>
                            <Button 
                            variant="outline" 
                            size="sm" 
                            className="w-full"
                            onClick={() => handleOpenAgentSettings(true)}
                            >
                            <Settings2 className="h-3.5 w-3.5 mr-2" />
                            Setup Agent
                            </Button>
                        </div>
                        )}
                    </div>
                )}

                  {/* Pricing Section */}
                {negotiation && (
                  <div>
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5">
                        <DollarSign className="h-4 w-4" />
                        Pricing
                    </h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Initial Price:</span>
                        <span className="font-medium">{negotiation.initialRequest.price}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Current Price:</span>
                        <span className="font-medium">{currentPrice || "N/A"}</span> {/* Display direct currentPrice */}
                      </div>
                      {savings > 0 && (
                        <div className="flex justify-between text-green-700 bg-green-50 px-2 py-1 rounded">
                          <span className="font-medium">Potential Savings:</span>
                          <span className="font-medium">
                            €{savings.toFixed(2).replace('.', ',')} ({savingsPercentage.toFixed(1).replace('.', ',')}%)
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                  {/* Status & Timeline Section */}
                {negotiation && (
                   <div>
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5">
                       <Clock className="h-4 w-4" />
                       Timeline & Status
                    </h3>
                     <div className="space-y-2 text-sm">
                       <div className="flex justify-between">
                         <span className="text-muted-foreground">Status:</span>
                         <Badge
                          variant={
                            negotiation.status === "pending" ? "secondary" :
                            negotiation.status === "accepted" ? "default" :
                            negotiation.status === "rejected" ? "destructive" :
                            "outline"
                          }
                            className="px-1.5 py-0.5 text-xs"
                         >
                           {negotiation.status === "pending" ? "Active" :
                              negotiation.status.charAt(0).toUpperCase() + negotiation.status.slice(1)}
                         </Badge>
                       </div>
                       <div className="flex justify-between">
                         <span className="text-muted-foreground">Created:</span>
                         <span title={format(new Date(negotiation.createdAt), "PPpp")}>
                           {formatDistanceToNow(new Date(negotiation.createdAt), { addSuffix: true })}
                         </span>
                       </div>
                       <div className="flex justify-between">
                         <span className="text-muted-foreground">Last Update:</span>
                         <span title={format(new Date(negotiation.updatedAt), "PPpp")}>
                           {formatDistanceToNow(new Date(negotiation.updatedAt), { addSuffix: true })}
                         </span>
                       </div>
                     </div>
                   </div>
                )}

                  {/* Initial Request Details Section */}
                {negotiation && (
                  <div>
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5">
                       <Package className="h-4 w-4" />
                       Shipment Details
                    </h3>
                     <div className="space-y-2 text-sm">
                       <div className="flex justify-between">
                         <span className="text-muted-foreground">Commodity:</span>
                         <span>{negotiation.initialRequest.loadType}</span>
                       </div>
                       {negotiation.initialRequest.dimensions && (
                          <div className="flex justify-between items-center">
                             <span className="text-muted-foreground flex items-center gap-1"><Ruler className="h-3.5 w-3.5"/>Dimensions:</span>
                           <span>{negotiation.initialRequest.dimensions}</span>
                         </div>
                       )}
                       {negotiation.initialRequest.weight && (
                         <div className="flex justify-between items-center">
                             <span className="text-muted-foreground flex items-center gap-1"><Weight className="h-3.5 w-3.5"/>Weight:</span>
                           <span>{negotiation.initialRequest.weight}</span>
                         </div>
                       )}
                     </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      
      {/* Agent Settings Modal */}
      <AgentSettingsModal 
        isOpen={isAgentSettingsOpen}
        onOpenChange={handleOpenAgentSettings}
        negotiation={negotiation}
        targetPricePerKm={targetPricePerKm}
        setTargetPricePerKm={setTargetPricePerKm}
        negotiationMode={negotiationMode}
        setNegotiationMode={setNegotiationMode}
        targetPercentage={targetPercentage}
        setTargetPercentage={setTargetPercentage}
        isConfiguringAgent={isConfiguringAgent}
        agentStyle={agentStyle}
        setAgentStyle={setAgentStyle}
        notifyOnPriceIncrease={notifyOnPriceIncrease}
        setNotifyOnPriceIncrease={setNotifyOnPriceIncrease}
        notifyOnNewTerms={notifyOnNewTerms}
        setNotifyOnNewTerms={setNotifyOnNewTerms}
        notifyAfterRounds={notifyAfterRounds}
        setNotifyAfterRounds={setNotifyAfterRounds}
        maxAutoReplies={maxAutoReplies}
        setMaxAutoReplies={setMaxAutoReplies}
        handleToggleAgent={handleToggleAgent}
        calculateCurrentPricePerKm={calculateCurrentPricePerKm}
        calculateTargetPrice={calculateTargetPrice}
      />
    </div>
  );
} 