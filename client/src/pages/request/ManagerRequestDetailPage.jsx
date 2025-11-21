// Manager-specific Request Detail Page
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { getRequest, updateRequestStatus } from "../../api/requestApi";
import { fmtDateTime24 } from "../../utils/datetime";
import { fmtAddress } from "../../utils/address";
import RouteMapLibre from "../../components/map/RouteMapLibre";
import ApprovalModal from "../../components/dashboard/ApprovalModal";
import Button from "../../components/shared/Button";
import StatusBadge from "../../components/shared/StatusBadge";

const getStatusLabel = (status) => {
  const statusMap = {
    PENDING_CONFIRMATION: "Pending Confirmation",
    UNDER_SURVEY: "Under Survey",
    WAITING_PAYMENT: "Waiting Payment",
    IN_PROGRESS: "In Progress",
    DONE: "Completed",
    CANCELLED: "Cancelled",
    REJECTED: "Rejected",
    PENDING_REVIEW: "Pending Review",
    PENDING: "Pending Approval",
    APPROVED: "Approved",
    submitted: "Submitted",
    approved: "Approved",
    rejected: "Rejected"
  };
  return statusMap[status] || status;
};

const getStatusColor = (status) => {
  const colors = {
    PENDING_CONFIRMATION: { color: "#ff9800", bg: "#fff3e0" },
    UNDER_SURVEY: { color: "#2196f3", bg: "#e3f2fd" },
    WAITING_PAYMENT: { color: "#9c27b0", bg: "#f3e5f5" },
    IN_PROGRESS: { color: "#00bcd4", bg: "#e0f7fa" },
    DONE: { color: "#4caf50", bg: "#e8f5e9" },
    CANCELLED: { color: "#f44336", bg: "#ffebee" },
    REJECTED: { color: "#757575", bg: "#fafafa" },
    PENDING_REVIEW: { color: "#ff9800", bg: "#fff3e0" },
    PENDING: { color: "#ff9800", bg: "#fff3e0" },
    APPROVED: { color: "#4caf50", bg: "#e8f5e9" },
    submitted: { color: "#ff9800", bg: "#fff3e0" },
    approved: { color: "#4caf50", bg: "#e8f5e9" },
    rejected: { color: "#f44336", bg: "#ffebee" }
  };
  return colors[status] || { color: "#757575", bg: "#fafafa" };
};

// Convert GeoJSON -> {lat, lng}
function toLatLng(geo) {
  if (!geo) return null;
  if (geo.type === "Point" && Array.isArray(geo.coordinates) && geo.coordinates.length === 2) {
    return { lng: geo.coordinates[0], lat: geo.coordinates[1] };
  }
  if (typeof geo.lat === "number" && typeof geo.lng === "number") return geo;
  return null;
}

export default function ManagerRequestDetailPage() {
  const { id } = useParams();
  const nav = useNavigate();
  const { user } = useAuth();
  const [req, setReq] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [approvalActionType, setApprovalActionType] = useState('approve');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const response = await getRequest(id);
        const requestData = response.request || response;
        setReq(requestData);
      } catch (e) {
        setError("Failed to load request");
        console.error("Request detail error:", e);
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  // Refresh request data
  const refreshRequest = async () => {
    try {
      const response = await getRequest(id);
      const requestData = response.request || response;
      setReq(requestData);
    } catch (e) {
      console.error("Error refreshing request:", e);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: 24, textAlign: "center" }}>
        <p>Loading request details...</p>
      </div>
    );
  }

  if (error || !req) {
    return (
      <div style={{ padding: 24 }}>
        <div style={{ color: "red", marginBottom: 16 }}>{error || "Request not found"}</div>
        <Button onClick={() => nav("/manager-dashboard")}>
          ← Back to Dashboard
        </Button>
      </div>
    );
  }

  // Parse notes to get quote info if available
  let quoteInfo = null;
  try {
    if (req.notes) {
      quoteInfo = typeof req.notes === "string" ? JSON.parse(req.notes) : req.notes;
    }
  } catch (e) {
    // Notes is not JSON, ignore
  }

  const statusConfig = getStatusColor(req.status);
  const pickupLoc = toLatLng(req.pickupLocation || req.location);
  const deliveryLoc = toLatLng(req.deliveryLocation || req.location);
  // Show approve/reject buttons for requests that need manager approval
  // This includes UNDER_SURVEY (after staff completed survey), PENDING, and submitted
  const canApproveOrDeny = (req.status === 'PENDING' || req.status === 'submitted' || req.status === 'UNDER_SURVEY');

  return (
    <div style={{ padding: 24, maxWidth: 1200, margin: "auto" }}>
      {/* Header */}
      <div style={{ 
        display: "flex", 
        justifyContent: "space-between", 
        alignItems: "center", 
        marginBottom: 24,
        paddingBottom: 16,
        borderBottom: "2px solid #e0e0e0"
      }}>
        <div>
          <h1 style={{ margin: 0, marginBottom: 8 }}>Request Details</h1>
          <code style={{ fontSize: "0.9em", color: "#666", background: "#f5f5f5", padding: "4px 8px", borderRadius: 4 }}>
            Request #{req.requestId || req._id?.slice(-12) || "N/A"}
          </code>
        </div>
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <StatusBadge status={req.status} />
          <Button variant="secondary" onClick={() => nav("/manager-dashboard")}>
            ← Back to Dashboard
          </Button>
        </div>
      </div>

      {/* Status Banner */}
      <div style={{ 
        marginBottom: 24, 
        padding: 16, 
        background: statusConfig.bg, 
        borderRadius: 8, 
        border: `2px solid ${statusConfig.color}` 
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <strong style={{ color: statusConfig.color, fontSize: "1.1em" }}>
            Status: {getStatusLabel(req.status)}
          </strong>
          <div style={{ fontSize: "0.9em", color: "#666", marginLeft: "auto" }}>
            Created: {new Date(req.createdAt || req.requestDate).toLocaleString()}
          </div>
        </div>
      </div>

      {/* Approval Actions - Show approve/reject for requests needing manager approval */}
      {canApproveOrDeny && (
        <div style={{ 
          marginBottom: 24, 
          padding: 20, 
          background: "#fff3cd", 
          borderRadius: 8, 
          border: "2px solid #ffc107" 
        }}>
          <h3 style={{ marginTop: 0, marginBottom: 16 }}>⚠️ Action Required</h3>
          <p style={{ marginBottom: 16 }}>
            This request is pending your approval. Please review all details below before making a decision.
          </p>
          <div style={{ display: "flex", gap: 12 }}>
            <Button 
              variant="success" 
              onClick={() => {
                setApprovalActionType('approve');
                setShowApprovalModal(true);
              }}
              style={{ padding: "12px 24px", fontSize: "16px" }}
            >
              ✅ Approve Request
            </Button>
            <Button 
              variant="danger" 
              onClick={() => {
                setApprovalActionType('reject');
                setShowApprovalModal(true);
              }}
              style={{ padding: "12px 24px", fontSize: "16px" }}
            >
              ❌ Deny Request
            </Button>
          </div>
        </div>
      )}

      {/* Create Contract Button - Show after request is approved */}
      {req.status === 'approved' && !req.contractId && (
        <div style={{ 
          marginBottom: 24, 
          padding: 20, 
          background: "#e8f5e9", 
          borderRadius: 8, 
          border: "2px solid #4caf50" 
        }}>
          <h3 style={{ marginTop: 0, marginBottom: 16 }}>✅ Request Approved</h3>
          <p style={{ marginBottom: 16 }}>
            This request has been approved. You can now create a contract for the customer.
          </p>
          <Button 
            variant="primary" 
            onClick={() => nav(`/contract-form/${req._id}`)}
            style={{ padding: "12px 24px", fontSize: "16px" }}
          >
            📋 Create Contract
          </Button>
        </div>
      )}

      {/* Approval History - Only show if approval data exists and is valid */}
      {req.approval && (req.approval.approved !== undefined || req.approval.reviewedAt) && (
        <div style={{ marginBottom: 24, padding: 16, background: "#f5f5f5", borderRadius: 8 }}>
          <h2 style={{ marginTop: 0, marginBottom: 16 }}>Approval History</h2>
          <div style={{ display: "grid", gap: 12 }}>
            {req.approval.approved !== undefined && (
              <div>
                <strong>Decision:</strong> {req.approval.approved ? "✅ Approved" : "❌ Rejected"}
              </div>
            )}
            {req.approval.reviewedAt && !isNaN(new Date(req.approval.reviewedAt).getTime()) && (
              <div>
                <strong>Reviewed At:</strong> {new Date(req.approval.reviewedAt).toLocaleString()}
              </div>
            )}
            {req.approval.rejectionReason && req.approval.rejectionReason.trim() && (
              <div>
                <strong>Rejection Reason:</strong>
                <div style={{ marginTop: 8, padding: 12, background: "#fff", borderRadius: 4 }}>
                  {req.approval.rejectionReason}
                </div>
              </div>
            )}
            {req.approval.notes && req.approval.notes.trim() && (
              <div>
                <strong>Notes:</strong>
                <div style={{ marginTop: 8, padding: 12, background: "#fff", borderRadius: 4 }}>
                  {req.approval.notes}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Customer Information */}
      <div style={{ marginBottom: 24, padding: 16, background: "#f5f5f5", borderRadius: 8 }}>
        <h2 style={{ marginTop: 0, marginBottom: 16 }}>Customer Information</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: 16 }}>
          <div>
            <strong>Name:</strong> {req.customerId?.name || req.customerName || "N/A"}
          </div>
          <div>
            <strong>Email:</strong> {req.customerId?.email || "N/A"}
          </div>
          <div>
            <strong>Phone:</strong> {req.customerPhone || req.moveDetails?.phone || "N/A"}
          </div>
        </div>
      </div>

      {/* Addresses */}
      <div style={{ marginBottom: 24, padding: 16, background: "#f5f5f5", borderRadius: 8 }}>
        <h2 style={{ marginTop: 0, marginBottom: 16 }}>Addresses</h2>
        <div style={{ display: "grid", gap: 16 }}>
          <div>
            <strong style={{ color: "#4caf50" }}>📍 Pickup Address:</strong>
            <div style={{ marginTop: 4, padding: 12, background: "#fff", borderRadius: 4 }}>
              {req.pickupAddress 
                ? fmtAddress(req.pickupAddress) 
                : req.moveDetails?.fromAddress 
                ? req.moveDetails.fromAddress 
                : fmtAddress(req.address) || "N/A"}
            </div>
            {pickupLoc && (
              <div style={{ fontSize: "0.85em", color: "#666", marginTop: 4 }}>
                Coordinates: {pickupLoc.lat.toFixed(6)}, {pickupLoc.lng.toFixed(6)}
              </div>
            )}
          </div>
          <div>
            <strong style={{ color: "#f44336" }}>🎯 Delivery Address:</strong>
            <div style={{ marginTop: 4, padding: 12, background: "#fff", borderRadius: 4 }}>
              {req.deliveryAddress 
                ? fmtAddress(req.deliveryAddress) 
                : req.moveDetails?.toAddress 
                ? req.moveDetails.toAddress 
                : fmtAddress(req.address) || "N/A"}
            </div>
            {deliveryLoc && (
              <div style={{ fontSize: "0.85em", color: "#666", marginTop: 4 }}>
                Coordinates: {deliveryLoc.lat.toFixed(6)}, {deliveryLoc.lng.toFixed(6)}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Map */}
      {pickupLoc && deliveryLoc && (
        <div style={{ marginBottom: 24 }}>
          <h2 style={{ marginBottom: 12 }}>Route Map</h2>
          <RouteMapLibre
            pickup={pickupLoc}
            delivery={deliveryLoc}
            height={400}
          />
        </div>
      )}

      {/* Service Information */}
      <div style={{ marginBottom: 24, padding: 16, background: "#f5f5f5", borderRadius: 8 }}>
        <h2 style={{ marginTop: 0, marginBottom: 16 }}>Service Information</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12 }}>
          <div>
            <strong>Move Date:</strong> {fmtDateTime24(req.movingTime || req.moveDetails?.moveDate)}
          </div>
          <div>
            <strong>Service Type:</strong> {
              req.serviceType === "EXPRESS" || req.moveDetails?.serviceType === "Long Distance" 
                ? "Express" 
                : req.moveDetails?.serviceType || "Standard"
            }
          </div>
          {req.surveyFee && (
            <div>
              <strong>Survey Fee:</strong> {req.surveyFee.toLocaleString()} VND
            </div>
          )}
        </div>
      </div>

      {/* Items List */}
      {((quoteInfo?.items && quoteInfo.items.length > 0) || (req.items && req.items.length > 0)) && (
        <div style={{ marginBottom: 24, padding: 16, background: "#f5f5f5", borderRadius: 8 }}>
          <h2 style={{ marginTop: 0, marginBottom: 16 }}>
            Items for Transportation ({(quoteInfo?.items?.length || req.items?.length || 0)} items)
          </h2>
          <div style={{ display: "grid", gap: 12 }}>
            {(req.items || quoteInfo?.items || []).map((item, idx) => (
              <div key={idx} style={{ padding: 16, background: "#fff", borderRadius: 6, border: "1px solid #ddd" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: 8 }}>
                  <strong style={{ fontSize: "1.1em" }}>
                    {idx + 1}. {item.description || item.name || `Item ${idx + 1}`}
                  </strong>
                  {item.requiresSpecialHandling && (
                    <span style={{ 
                      padding: "4px 8px", 
                      background: "#ff9800", 
                      color: "#fff", 
                      borderRadius: 4, 
                      fontSize: "0.85em" 
                    }}>
                      ⚠️ Special Handling
                    </span>
                  )}
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 8, marginTop: 8 }}>
                  {item.quantity && (
                    <div><strong>Quantity:</strong> {item.quantity}</div>
                  )}
                  {item.category && (
                    <div><strong>Category:</strong> {item.category}</div>
                  )}
                  {(item.weight || item.dimensions?.weight) && (
                    <div><strong>Weight:</strong> {item.weight || item.dimensions.weight} kg</div>
                  )}
                  {(item.length && item.width && item.height) && (
                    <div><strong>Dimensions:</strong> {item.length}×{item.width}×{item.height} cm</div>
                  )}
                  {(item.dimensions?.length && item.dimensions.width && item.dimensions.height) && (
                    <div><strong>Dimensions:</strong> {item.dimensions.length}×{item.dimensions.width}×{item.dimensions.height} cm</div>
                  )}
                  {item.estimatedValue && (
                    <div><strong>Estimated Value:</strong> {item.estimatedValue.toLocaleString()} VND</div>
                  )}
                </div>
                {item.images && item.images.length > 0 && (
                  <div style={{ marginTop: 12, display: "flex", gap: 8, flexWrap: "wrap" }}>
                    {item.images.map((img, imgIdx) => (
                      <img 
                        key={imgIdx} 
                        src={img} 
                        alt={`${item.description || item.name} ${imgIdx + 1}`} 
                        style={{ 
                          width: 80, 
                          height: 80, 
                          objectFit: "cover", 
                          borderRadius: 4, 
                          border: "1px solid #ddd",
                          cursor: "pointer"
                        }}
                        onClick={() => window.open(img, "_blank")}
                      />
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quote Information */}
      {quoteInfo && (quoteInfo.vehicleType || quoteInfo.helpers || quoteInfo.extras || quoteInfo.quoteTotal) && (
        <div style={{ marginBottom: 24, padding: 16, background: "#e8f5e9", borderRadius: 8, border: "2px solid #4caf50" }}>
          <h2 style={{ marginTop: 0, marginBottom: 16 }}>Quote Information</h2>
          <div style={{ display: "grid", gap: 12 }}>
            {quoteInfo.vehicleType && (
              <div><strong>Vehicle Type:</strong> {quoteInfo.vehicleType}</div>
            )}
            {quoteInfo.helpers && (
              <div><strong>Number of Helpers:</strong> {quoteInfo.helpers} people</div>
            )}
            {quoteInfo.extras && quoteInfo.extras.length > 0 && (
              <div>
                <strong>Additional Services:</strong>{" "}
                {quoteInfo.extras.map((e) => {
                  const names = {
                    wrap: "Wrapping",
                    disassemble: "Disassemble/Reassemble",
                    climb: "High Floor Moving",
                    clean: "Cleaning",
                    storage: "Storage",
                  };
                  return names[e] || e;
                }).join(", ")}
              </div>
            )}
            {quoteInfo.quoteTotal && (
              <div style={{ marginTop: 8, padding: 12, background: "#fff", borderRadius: 6 }}>
                <strong style={{ fontSize: "1.2em", color: "#4caf50" }}>
                  Total Quote: {quoteInfo.quoteTotal.toLocaleString()} VND
                </strong>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Images */}
      {req.images && req.images.length > 0 && (
        <div style={{ marginBottom: 24, padding: 16, background: "#f5f5f5", borderRadius: 8 }}>
          <h2 style={{ marginTop: 0, marginBottom: 16 }}>Attached Images ({req.images.length})</h2>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            {req.images.map((img, idx) => (
              <img
                key={idx}
                src={img}
                alt={`Image ${idx + 1}`}
                style={{
                  width: 150,
                  height: 150,
                  objectFit: "cover",
                  borderRadius: 6,
                  border: "1px solid #ddd",
                  cursor: "pointer",
                }}
                onClick={() => window.open(img, "_blank")}
              />
            ))}
          </div>
        </div>
      )}

      {/* Notes */}
      {req.notes && !quoteInfo && (
        <div style={{ marginBottom: 24, padding: 16, background: "#f5f5f5", borderRadius: 8 }}>
          <h2 style={{ marginTop: 0, marginBottom: 16 }}>Notes</h2>
          <div style={{ whiteSpace: "pre-wrap", padding: 12, background: "#fff", borderRadius: 4 }}>
            {req.notes}
          </div>
        </div>
      )}

      {/* Timestamps */}
      <div style={{ marginBottom: 24, padding: 16, background: "#f5f5f5", borderRadius: 8 }}>
        <h2 style={{ marginTop: 0, marginBottom: 16 }}>Timeline</h2>
        <div style={{ display: "grid", gap: 8 }}>
          <div>
            <strong>Created:</strong> {new Date(req.createdAt || req.requestDate).toLocaleString()}
          </div>
          {req.estimatedDelivery && (
            <div>
              <strong>Estimated Delivery:</strong> {new Date(req.estimatedDelivery).toLocaleString()}
            </div>
          )}
          {req.actualDelivery && (
            <div>
              <strong>Actual Delivery:</strong> {new Date(req.actualDelivery).toLocaleString()}
            </div>
          )}
        </div>
      </div>

      {/* Approval Modal */}
      <ApprovalModal
        isOpen={showApprovalModal}
        onClose={() => {
          setShowApprovalModal(false);
          setProcessing(false);
        }}
        request={req}
        actionType={approvalActionType}
        loading={processing}
        onApprove={async (requestId, approvalData) => {
          try {
            setProcessing(true);
            // Ensure status is set correctly
            const statusData = {
              ...approvalData,
              status: approvalActionType === 'approve' ? 'approved' : 'rejected'
            };
            await updateRequestStatus(requestId, statusData);
            const successMessage = approvalActionType === 'approve' 
              ? 'Request approved successfully! You can now create a contract.'
              : 'Request rejected successfully!';
            alert(successMessage);
            setShowApprovalModal(false);
            // Refresh request data to show updated status
            await refreshRequest();
            // Don't navigate away - let user see the updated status and Create Contract button
          } catch (err) {
            console.error('Error updating request status:', err);
            alert('Error: ' + (err.response?.data?.message || err.message || `Failed to ${approvalActionType} request`));
          } finally {
            setProcessing(false);
          }
        }}
      />
    </div>
  );
}

