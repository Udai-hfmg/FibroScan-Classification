import React, { useRef, useState } from "react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { getFibrosisStage, getSteatosisGrade } from "../helpers/Classification";

interface FibroScanReportDesignProps {
    patientName: string;
    patientDateOfBirth: string;
    patientGender: string;
    patientCode?: string;
    institutionName: string;
    institutionCity: string;
    institutionState: string;
    institutionPostalCode: string;
    institutionCountry: string;
    examDate: string;
    capValue: string;
    eValue: string;
    steatosisLabel?: string;
    steatosisDescription?: string;
    fibrosisLabel?: string;
    fibrosisDescription?: string;
    precautionsText?: string;
    classificationTitle?: string;
    reset?: () => void;
}

export default function FibroScanReportDesign({
    patientName,
    patientDateOfBirth,
    patientGender,
    patientCode,
    institutionName,
    institutionCity,
    institutionState,
    institutionPostalCode,
    institutionCountry,
    examDate,
    capValue,
    eValue,
    precautionsText = "The VCTE examination with FibroScan® device should be performed according to the manufacturer recommendations and fulfill good quality criteria. The software is not intended as a primary diagnostic tool by physicians or to be used as a substitute for professional healthcare advice. Each user is responsible for ensuring compliance with applicable international, national, and local clinical regulations and other specific accreditations requirements. The results obtained must be interpreted by a physician experienced in dealing with liver disease, taking into account the complete medical records of the patient.",
    classificationTitle = "HORIZON CLASSIFICATION",
    reset
}: FibroScanReportDesignProps) {
    const reportRef = useRef<HTMLDivElement>(null);
    const [isDownloading, setIsDownloading] = useState(false);

    // Calculate gauge position
    const getGaugePosition = (value: number, min: number, max: number): number => {
        const percentage = ((value - min) / (max - min)) * 100;
        return Math.min(Math.max(percentage, 0), 100);
    };

    const capNum = parseFloat(capValue);
    const eNum = parseFloat(eValue);
    const capPosition = getGaugePosition(capNum, 100, 350);
    const ePosition = getGaugePosition(eNum, 5, 20);

    // Classification based on provided range

    const capClassification = getSteatosisGrade(capNum);
    const eClassification = getFibrosisStage(eNum);

    // Download PDF Function with color fix
    const downloadPDF = async () => {
        if (!reportRef.current) return;

        setIsDownloading(true);
        try {
            const element = reportRef.current;

            // Create canvas from DOM element
            const canvas = await html2canvas(element, {
                scale: 2,
                useCORS: true,
                logging: false,
                backgroundColor: "#ffffff",
                allowTaint: true,
            });

            const imgData = canvas.toDataURL("image/png");
            const pdf = new jsPDF("p", "mm", "a4");

            const imgWidth = 210; // A4 width in mm
            const pageHeight = 297; // A4 height in mm
            const imgHeight = (canvas.height * imgWidth) / canvas.width;

            let heightLeft = imgHeight;
            let position = 0;

            // Add first page
            pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
            heightLeft -= pageHeight;

            // Add additional pages if needed
            while (heightLeft >= 0) {
                position = heightLeft - imgHeight;
                pdf.addPage();
                pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
                heightLeft -= pageHeight;
            }

            // Generate filename
            const cleanName = patientName.replace(/\s+/g, "_");
            const cleanDate = examDate.replace(/\//g, "");
            const filename = `FibroScan_${cleanName}_${cleanDate}.pdf`;

            pdf.save(filename);
        } catch (error) {
            console.error("Error generating PDF:", error);
            alert("Error generating PDF. Please try again.");
        } finally {
            setIsDownloading(false);
        }
    };

    return (
        <div style={{ width: "100%" }}>
            {/* ===== DOWNLOAD & PRINT BUTTONS ===== */}
            <div style={{
                background: "linear-gradient(to bottom, #f9fafb, #ffffff)",
                padding: "24px",
                display: "flex",
                gap: "12px",
                justifyContent: "center",
                position: "sticky",
                top: 0,
                zIndex: 20,
                boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
                marginBottom: "24px",
                borderRadius: "0 0 8px 8px",
            }}>
                <button
                    onClick={downloadPDF}
                    disabled={isDownloading}
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        padding: "12px 24px",
                        borderRadius: "8px",
                        fontWeight: "600",
                        border: "none",
                        cursor: isDownloading ? "not-allowed" : "pointer",
                        background: isDownloading ? "#9ca3af" : "linear-gradient(to right, #f97316, #ea580c)",
                        color: "white",
                        boxShadow: "0 10px 15px rgba(0, 0, 0, 0.1)",
                        transition: "all 300ms",
                        opacity: isDownloading ? 0.7 : 1,
                    }}
                    onMouseEnter={(e) => !isDownloading && (e.currentTarget.style.boxShadow = "0 10px 25px rgba(249, 115, 22, 0.5)")}
                    onMouseLeave={(e) => (e.currentTarget.style.boxShadow = "0 10px 15px rgba(0, 0, 0, 0.1)")}
                >
                    {isDownloading ? (
                        <>
                            <svg style={{ width: "20px", height: "20px", animation: "spin 1s linear infinite" }} fill="none" viewBox="0 0 24 24">
                                <circle style={{ opacity: 0.25 }} cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path
                                    style={{ opacity: 0.75 }}
                                    fill="currentColor"
                                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                ></path>
                            </svg>
                            Generating PDF...
                        </>
                    ) : (
                        <>
                            <svg style={{ width: "20px", height: "20px" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                            </svg>
                            Download PDF
                        </>
                    )}
                </button>

                <button
                    onClick={reset}
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        padding: "12px 24px",
                        borderRadius: "8px",
                        fontWeight: "600",
                        border: "2px solid #d1d5db",
                        cursor: "pointer",
                        background: "white",
                        color: "#1f2937",
                        boxShadow: "0 10px 15px rgba(0, 0, 0, 0.1)",
                        transition: "all 300ms",
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.background = "#f3f4f6";
                        e.currentTarget.style.borderColor = "#9ca3af";
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.background = "white";
                        e.currentTarget.style.borderColor = "#d1d5db";
                    }}
                >
                    <svg style={{ width: "20px", height: "20px" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4H9a2 2 0 00-2 2v2a2 2 0 002 2h6a2 2 0 002-2v-2a2 2 0 00-2-2zm-6-4a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    Upload another pdf
                </button>
            </div>

            {/* ===== REPORT CONTENT ===== */}
            <div ref={reportRef} style={{ width: "100%", background: "white", padding: "32px", border: "1px solid #d1d5db" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px", marginTop: "20px" }}>
                    <h1 style={{ fontSize: "24px", fontWeight: "bold", color: "#1f2937", letterSpacing: "0.05em", marginBottom: 24 }}>Exam Interpretation</h1>
                    <img src="/image.png" alt="Fibro scan" style={{ width: "140px", height: "auto", marginBottom: "24px", }} />
                </div>
                {/* ===== HEADER ===== */}
                <div style={{ borderBottom: "2px solid #1f2937", marginBottom: "24px", paddingBottom: "16px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                        {/* Institution Section */}
                        <div>
                            <h1 style={{ fontSize: "14px", fontWeight: "bold", color: "#1f2937", letterSpacing: "0.05em" }}>INSTITUTION</h1>
                            <p style={{ fontSize: "12px", color: "#374151", marginTop: "12px", fontWeight: "500" }}>{institutionName}</p>
                            <p style={{ fontSize: "12px", color: "#374151" }}>{institutionCity}</p>
                            <p style={{ fontSize: "12px", color: "#374151" }}>{institutionState}</p>
                            <p style={{ fontSize: "12px", color: "#374151" }}>{institutionPostalCode}</p>
                            <p style={{ fontSize: "12px", color: "#374151" }}>{institutionCountry}</p>
                        </div>

                        {/* Patient Section */}
                        <div style={{ textAlign: "right" }}>
                            <h1 style={{ fontSize: "14px", fontWeight: "bold", color: "#1f2937", letterSpacing: "0.05em" }}>PATIENT</h1>
                            <p style={{ fontSize: "12px", fontWeight: "bold", color: "#1f2937", marginTop: "12px" }}>{patientName}</p>
                            <p style={{ fontSize: "12px", color: "#374151", marginTop: "4px" }}>Date of Birth: {patientDateOfBirth}</p>
                            <p style={{ fontSize: "12px", color: "#374151" }}>Gender: {patientGender}</p>
                            <p style={{ fontSize: "12px", color: "#374151" }}>Patient code: {patientCode}</p>
                        </div>
                    </div>
                </div>

                {/* ===== FIBROSCAN READINGS ===== */}
                <div style={{ borderBottom: "2px solid #1f2937", marginBottom: "24px", paddingBottom: "16px" }}>
                    <h2 style={{ fontSize: "14px", fontWeight: "bold", color: "#1f2937", marginBottom: "16px", letterSpacing: "0.05em" }}>FIBROSCAN READINGS</h2>
                    <p style={{ textAlign: "center", fontSize: "12px", color: "#374151", marginBottom: "16px" }}>
                        VCTE liver examination date: {examDate}
                    </p>
                    <div style={{ display: "flex", justifyContent: "center", gap: "96px" }}>
                        <div style={{ textAlign: "center" }}>
                            <p style={{ fontSize: "36px", fontWeight: "bold", color: "#2563eb" }}>{capValue}</p>
                            <p style={{ fontSize: "12px", color: "#4b5563", marginTop: "8px" }}>CAP = {capValue} dB/m</p>
                        </div>
                        <div style={{ textAlign: "center" }}>
                            <p style={{ fontSize: "36px", fontWeight: "bold", color: "#f97316" }}>{eValue}</p>
                            <p style={{ fontSize: "12px", color: "#4b5563", marginTop: "8px" }}>E = {eValue} kPa</p>
                        </div>
                    </div>
                </div>

                {/* ===== RESULTS - GAUGES ===== */}
                <div style={{ borderBottom: "2px solid #1f2937", marginBottom: "24px", paddingBottom: "32px" }}>
                    <h2 style={{ fontSize: "14px", fontWeight: "bold", color: "#1f2937", marginBottom: "32px", letterSpacing: "0.05em" }}>HORIZON RESULTS</h2>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "48px" }}>
                        {/* Steatosis Grade Gauge */}
                        <div>
                            <h3 style={{ fontSize: "14px", fontWeight: "bold", color: "#2563eb", marginBottom: "24px", textAlign: "center" }}>STEATOSIS GRADE</h3>
                            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "16px" }}>
                                {/* Gauge Bar */}
                                <div style={{ width: "100%", padding: "8px" }}>
                                    <div style={{
                                        position: "relative",
                                        height: "10px",
                                        background: "linear-gradient(to right, #93c5fd, #60a5fa, #f472b6)",
                                        borderRadius: "9999px",
                                        display: "flex",
                                        alignItems: "center",
                                        padding: "8px",
                                        color: "white",
                                        fontSize: "12px",
                                        fontWeight: "bold",
                                    }}>
                                        {/* <span style={{ position: "absolute", left: "8px" }}>100</span>
                                        <span style={{ position: "absolute", right: "8px" }}>350</span> */}
                                    </div>
                                    {/* Gauge Pointer */}
                                    <div
                                        style={{
                                            position: "relative",
                                            height: "16px",
                                            marginTop: "-16px",
                                            display: "flex",
                                            alignItems: "center",
                                            paddingLeft: `calc(${capPosition}% - 12px)`,
                                            transition: "all 0.3s",
                                        }}
                                    >
                                        <div style={{
                                            width: "16px",
                                            height: "16px",
                                            background: "#3b82f6",
                                            borderRadius: "50%",
                                            border: "2px solid black",
                                            boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
                                        }}></div>
                                    </div>
                                </div>

                                {/* Classification Box */}
                                <div style={{
                                    background: "black",
                                    color: "white",
                                    padding: "8px 16px",
                                    borderRadius: "9999px",
                                    fontSize: "14px",
                                    fontWeight: "bold",
                                }}>
                                    {capClassification.label}
                                </div>

                                {/* Classification Description */}
                                <p style={{ fontSize: "12px", color: "#4b5563", textAlign: "center" }}>
                                    {capClassification.description}
                                </p>

                            </div>
                        </div>

                        {/* Fibrosis Stage Gauge */}
                        <div>
                            <h3 style={{ fontSize: "14px", fontWeight: "bold", color: "#f97316", marginBottom: "24px", textAlign: "center" }}>FIBROSIS STAGE</h3>
                            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "16px" }}>
                                {/* Gauge Bar */}
                                <div style={{ width: "100%", padding: "8px" }}>
                                    <div style={{
                                        position: "relative",
                                        height: "10px",
                                        background: "linear-gradient(to right, #93c5fd, #c4b5fd, #fb7185)",
                                        borderRadius: "9999px",
                                        display: "flex",
                                        alignItems: "center",
                                        padding: "8px",
                                        color: "white",
                                        fontSize: "12px",
                                        fontWeight: "bold",
                                    }}>

                                    </div>
                                    {/* Gauge Pointer */}
                                    <div
                                        style={{
                                            position: "relative",
                                            height: "19px",
                                            marginTop: "-19px",
                                            display: "flex",
                                            alignItems: "center",
                                            paddingLeft: `calc(${ePosition}% - 12px)`,
                                            transition: "all 0.3s",
                                        }}
                                    >
                                        <div style={{
                                            width: "16px",
                                            height: "16px",
                                            background: "#f97316",
                                            borderRadius: "50%",
                                            border: "2px solid black",
                                            boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
                                        }}>

                                        </div>
                                    </div>
                                </div>

                                {/* Classification Box */}
                                <div style={{
                                    background: "black",
                                    color: "white",
                                    padding: "8px 16px",
                                    borderRadius: "9999px",
                                    fontSize: "14px",
                                    fontWeight: "bold",
                                }}>
                                    {eClassification.label}
                                </div>

                                {/* Classification Description */}
                                <p style={{ fontSize: "12px", color: "#4b5563", textAlign: "center" }}>
                                    {eClassification.description}
                                </p>

                                {/* Range Info */}

                            </div>
                        </div>
                    </div>
                </div>

                {/* ===== CLASSIFICATION RESULTS ===== */}
                {(capClassification.label || eClassification.label) && (
                    <div style={{
                        background: "#eff6ff",
                        border: "1px solid #bfdbfe",
                        borderRadius: "8px",
                        padding: "16px",
                        marginBottom: "24px"
                    }}>
                        <h3 style={{ fontSize: "12px", fontWeight: "bold", color: "#1e40af", marginBottom: "12px", letterSpacing: "0.05em" }}>{classificationTitle}</h3>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                            {capClassification.label && (
                                <div>
                                    <p style={{ fontSize: "12px", fontWeight: "600", color: "#2563eb" }}>Steatosis Grade</p>
                                    <p style={{ fontSize: "14px", fontWeight: "bold", color: "#1e40af" }}>{capClassification?.label}</p>
                                    {capClassification?.description && (
                                        <p style={{ fontSize: "12px", color: "#4b5563", marginTop: "4px" }}>{capClassification?.description}</p>
                                    )}
                                </div>
                            )}
                            {eClassification.label && (
                                <div>
                                    <p style={{ fontSize: "12px", fontWeight: "600", color: "#ea580c" }}>Fibrosis Stage</p>
                                    <p style={{ fontSize: "14px", fontWeight: "bold", color: "#b45309" }}>{eClassification?.label}</p>
                                    {eClassification?.description && (
                                        <p style={{ fontSize: "12px", color: "#4b5563", marginTop: "4px" }}>{eClassification?.description}</p>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* ===== REFERENCE PUBLICATIONS ===== */}
                <div style={{ borderBottom: "2px solid #1f2937", marginBottom: "24px", paddingBottom: "24px" }}>
                    <h2 style={{ fontSize: "14px", fontWeight: "bold", color: "#1f2937", marginBottom: "16px", letterSpacing: "0.05em" }}>REFERENCE PUBLICATIONS</h2>
                    <p style={{ fontSize: "12px", color: "#374151", marginBottom: "12px", textAlign: "center" }}>
                        The results displayed above are based on the following publication(s)
                    </p>
                    <p style={{ fontSize: "12px", fontWeight: "bold", color: "#1f2937", marginBottom: "16px", textAlign: "center" }}>Etiology: MASH or MASLD</p>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px", paddingTop: "16px" }}>
                        <div>
                            <p style={{ fontSize: "12px", fontWeight: "600", color: "#1f2937" }}>
                                Rinella, Hepatology (2023), PMID: 36727674
                            </p>
                            <p style={{ fontSize: "12px", color: "#4b5563", marginTop: "8px" }}>Classification: Youden's index</p>
                        </div>
                        <div>
                            <p style={{ fontSize: "12px", fontWeight: "600", color: "#1f2937" }}>
                                Duarte-Rojo, Hepatology (2025), PMID: 38489521
                            </p>
                            <p style={{ fontSize: "12px", color: "#4b5563", marginTop: "8px" }}>Classification: Youden's index</p>
                        </div>
                    </div>
                </div>

                {/* ===== PRECAUTIONS ===== */}
                <div style={{
                    background: "#f9fafb",
                    padding: "16px",
                    borderRadius: "8px",
                    border: "1px solid #d1d5db",
                    marginBottom: "24px"
                }}>
                    <h3 style={{ fontSize: "12px", fontWeight: "bold", color: "#1f2937", marginBottom: "12px", letterSpacing: "0.05em" }}>PRECAUTIONS FOR USE</h3>
                    <p style={{ fontSize: "12px", color: "#374151", lineHeight: "1.6" }}>{precautionsText}</p>
                </div>




            </div>

            {/* ===== PRINT STYLES ===== */}
            <style>{`
                @keyframes spin {
                    to { transform: rotate(360deg); }
                }
                
                @media print {
                    body {
                        background: white;
                        margin: 0;
                        padding: 0;
                    }
                    
                    button {
                        display: none !important;
                    }
                    
                    div[style*="sticky"] {
                        display: none !important;
                    }
                }
            `}</style>
        </div>
    );
}