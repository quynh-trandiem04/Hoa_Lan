import { useState } from "react";
import { orchidData } from "../data";
import { Sparkles, RefreshCw, CheckCircle, AlertTriangle, Info, Smile, ChevronRight } from "lucide-react";

export default function CareCalculator() {
  const [selectedOrchidId, setSelectedOrchidId] = useState(orchidData[2].id); // default to Hồ Điệp
  const [wateringDays, setWateringDays] = useState(5); // watering every X days
  const [lightHours, setLightHours] = useState(4); // hours of daily sun
  const [soilType, setSoilType] = useState("moss"); // moss, pine, soil, charcoal
  const [locationType, setLocationType] = useState("indoor_light"); // indoor vs balcony vs direct yard

  const activeOrchid = orchidData.find((o) => o.id === selectedOrchidId) || orchidData[2];

  // Calculate scores and diagnostic feedback
  const getDiagnostic = () => {
    let idealWaterLower = 5;
    let idealWaterUpper = 8;
    let idealLightMin = 3;
    let idealLightMax = 6;
    let idealSoil = "moss";

    if (selectedOrchidId === "lan-rung") {
      idealWaterLower = 1;
      idealWaterUpper = 3;
      idealLightMin = 5;
      idealLightMax = 8;
      idealSoil = "pine_bark";
    } else if (selectedOrchidId === "lan-dot-bien") {
      idealWaterLower = 4;
      idealWaterUpper = 6;
      idealLightMin = 2;
      idealLightMax = 4;
      idealSoil = "moss";
    } else if (selectedOrchidId === "lan-ho-diep") {
      idealWaterLower = 6;
      idealWaterUpper = 9;
      idealLightMin = 3;
      idealLightMax = 5;
      idealSoil = "moss";
    } else if (selectedOrchidId === "lan-cattleya") {
      idealWaterLower = 3;
      idealWaterUpper = 5;
      idealLightMin = 6;
      idealLightMax = 9;
      idealSoil = "pine_bark"; // or charcoal
    }

    const wateringIssue = 
      wateringDays < idealWaterLower 
        ? "OVERWATER" 
        : wateringDays > idealWaterUpper 
          ? "UNDERWATER" 
          : "IDEAL";

    const lightIssue = 
      lightHours < idealLightMin 
        ? "LOW" 
        : lightHours > idealLightMax 
          ? "HIGH" 
          : "IDEAL";

    const soilIssue = 
      (idealSoil === "moss" && soilType !== "moss" && soilType !== "coco_chopped") 
        ? "NOT_RETAINING" 
        : (idealSoil === "pine_bark" && soilType === "plain_soil") 
          ? "TOO_COMPACT" 
          : "OK";

    let score = 100;
    const advisories: string[] = [];

    if (wateringIssue === "OVERWATER") {
      score -= 30;
      advisories.push("⚠️ Tưới quá dày: Chu kỳ tưới hiện tại (" + wateringDays + " ngày/lần) quá ẩm cho loài này. Nguy hiểm cao thối nhũn rễ và vàng lá chóp gốc. Hãy đợi rễ đổi sang màu xám bạc rồi hãy tưới nhé.");
    } else if (wateringIssue === "UNDERWATER") {
      score -= 25;
      advisories.push("⚠️ Tưới thiếu nước: Chu kỳ " + wateringDays + " ngày/lần gây khô héo rễ gió. Thân bẹ trữ nước sẽ nhăn nheo, rụng nụ hoặc héo sớm.");
    } else {
      score += 5;
    }

    if (lightIssue === "LOW") {
      score -= 25;
      advisories.push("☀️ Thiếu sáng: Chỉ " + lightHours + " giờ sáng tán xạ nhẹ khiến lá có màu xanh đen sậm, quang hợp kém và cực kỳ khó ra hoa.");
    } else if (lightIssue === "HIGH") {
      score -= 30;
      advisories.push("🔥 Thừa nắng: Cho " + lightHours + " giờ ánh sáng mạnh sẽ làm cháy úa diệp lục tế bào lá, tạo đốm cháy xém trắng giòn trên bản lá.");
    } else {
      score += 5;
    }

    if (soilIssue === "TOO_COMPACT" || soilType === "plain_soil") {
      score -= 35;
      advisories.push("🌱 Sai lệch giá thể nghiêm trọng: Tuyệt đối KHÔNG gieo lan xơ dính bằng đất vườn thông thường. Rễ khí sinh cần oxy thông khí thoáng đãng, trồng đất vườn sẽ bị ngạt chết rễ chỉ sau 1 tuần. Hãy chuyển gấp sang vỏ thông lớn hoặc than củi.");
    } else if (soilIssue === "NOT_RETAINING") {
      score -= 15;
      advisories.push("🌱 Khô giá thể: Loài lan nhỏ này phát triển khỏe mạnh hơn khi bọc bằng rêu trắng Chile ẩm mát, trồng dớn thô vỏ thông bự làm nước bốc hơi cực nhanh.");
    }

    // Caps
    score = Math.max(10, Math.min(100, score));

    return {
      score,
      wateringIssue,
      lightIssue,
      soilIssue,
      advisories,
      isPerfect: score >= 90
    };
  };

  const { score, advisories, isPerfect } = getDiagnostic();

  // Get color for score ring
  const getScoreColor = (s: number) => {
    if (s >= 85) return "text-emerald-600";
    if (s >= 60) return "text-amber-500";
    return "text-rose-500";
  };

  const getScoreBg = (s: number) => {
    if (s >= 85) return "bg-emerald-500/10 border-emerald-500/20";
    if (s >= 60) return "bg-amber-500/10 border-amber-500/20";
    return "bg-rose-500/10 border-rose-500/20";
  };

  return (
    <div className="bg-white rounded-xl border border-outline-variant/30 overflow-hidden luxury-shadow p-6 md:p-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-botanical-green/10 rounded-full flex items-center justify-center text-botanical-green">
          <Sparkles className="w-5 h-5 animate-pulse" />
        </div>
        <div>
          <h3 className="font-serif text-lg text-charcoal-text font-bold">Cố Vấn Điều Kiện Trồng Thử Nghiệm</h3>
          <p className="text-xs text-on-surface-variant font-sans">Kiểm tra miễn phí tiểu khí hậu vườn lan của bạn</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Input Parameters Form - Col 7 */}
        <div className="lg:col-span-7 space-y-6">
          {/* Target Orchid */}
          <div>
            <label className="block text-xs uppercase tracking-wider font-semibold text-charcoal-text mb-2 font-mono">
              1. Chọn Chi Lan Bạn Trồng
            </label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
              {orchidData.map((o) => (
                <button
                  key={o.id}
                  onClick={() => setSelectedOrchidId(o.id)}
                  className={`px-3 py-2 text-xs font-serif rounded border text-center transition-all cursor-pointer ${
                    selectedOrchidId === o.id
                      ? "bg-botanical-green text-white border-botanical-green shadow-sm"
                      : "bg-surface-cream text-on-surface hover:bg-surface-container border-surface-container/60"
                  }`}
                >
                  {o.name.split(" ")[1] || o.name}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Watering frequency */}
            <div className="bg-surface-cream/50 p-4 rounded-lg border border-surface-container/60">
              <label className="block text-[11px] uppercase tracking-wider font-semibold text-[#735c00] mb-2 font-mono flex justify-between">
                <span>2. Chu kỳ tưới nước</span>
                <span className="text-charcoal-text">{wateringDays} ngày/lần</span>
              </label>
              <input
                type="range"
                min="1"
                max="14"
                value={wateringDays}
                onChange={(e) => setWateringDays(Number(e.target.value))}
                className="w-full accent-botanical-green cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-on-surface-variant/70 font-sans mt-2">
                <span>Tưới liên tục (1 ngày)</span>
                <span>Ít tưới (14 ngày)</span>
              </div>
            </div>

            {/* Daily Light hours */}
            <div className="bg-surface-cream/50 p-4 rounded-lg border border-surface-container/60">
              <label className="block text-[11px] uppercase tracking-wider font-semibold text-[#735c00] mb-2 font-mono flex justify-between">
                <span>3. Giờ nắng nhận được</span>
                <span className="text-charcoal-text">{lightHours} giờ/ngày</span>
              </label>
              <input
                type="range"
                min="0"
                max="12"
                value={lightHours}
                onChange={(e) => setLightHours(Number(e.target.value))}
                className="w-full accent-botanical-green cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-on-surface-variant/70 font-sans mt-2">
                <span>Bóng bóng tối hẳn (0h)</span>
                <span>Nắng gắt giòn (12h)</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Soil Type Selection */}
            <div>
              <label className="block text-xs uppercase tracking-wider font-semibold text-charcoal-text mb-2 font-mono">
                4. Loại Giá Thể Sử Dụng
              </label>
              <select
                value={soilType}
                onChange={(e) => setSoilType(e.target.value)}
                className="w-full p-2.5 bg-surface-cream text-xs font-sans text-charcoal-text rounded border border-outline-variant/30 focus:border-botanical-green focus:ring-1 focus:ring-botanical-green outline-none"
              >
                <option value="moss">Rêu dớn Chile (Giữ ẩm cao)</option>
                <option value="pine_bark">Vỏ thông sấy tự nhiên (Ráo khí tốt)</option>
                <option value="charcoal">Than củi đập cục (Cực thoáng rễ)</option>
                <option value="plain_soil">Động đất vườn màu đen (⚠️ Đất trồng hoa hoa sứ)</option>
                <option value="coco_chopped">Xơ dừa băm (Giữ nước trung bình)</option>
              </select>
            </div>

            {/* Placement spot */}
            <div>
              <label className="block text-xs uppercase tracking-wider font-semibold text-charcoal-text mb-2 font-mono">
                5. Vị Trí Đặt Chậu Cây
              </label>
              <select
                value={locationType}
                onChange={(e) => setLocationType(e.target.value)}
                className="w-full p-2.5 bg-surface-cream text-xs font-sans text-charcoal-text rounded border border-outline-variant/30 focus:border-botanical-green focus:ring-1 focus:ring-botanical-green outline-none"
              >
                <option value="indoor_light">Cửa sổ trong nhà lọc rèm mờ</option>
                <option value="balcony_net">Ban công có giàn lưới đen che mát 70%</option>
                <option value="air_conditioned">Phòng điều hòa lạnh đóng kín</option>
                <option value="direct_sun">Sân vườn nắng rực rỡ không che chắn</option>
              </select>
            </div>
          </div>
        </div>

        {/* Results Analysis Panel - Col 5 */}
        <div className="lg:col-span-12 xl:col-span-5 flex flex-col h-full bg-surface-cream rounded-xl p-6 border border-antique-gold/15">
          <div className="text-center pb-6 border-b border-surface-container-high">
            <h4 className="text-xs uppercase tracking-wider text-[#735c00] font-mono font-bold mb-4">
              Điểm Sinh Học Phù Hợp (Viability Index)
            </h4>
            
            {/* Visual Ring Gauge */}
            <div className={`inline-flex flex-col items-center justify-center w-24 h-24 rounded-full border-4 ${getScoreBg(score)} relative`}>
              <span className={`text-3xl font-serif font-bold ${getScoreColor(score)}`}>
                {score}%
              </span>
              <span className="text-[9px] font-mono uppercase tracking-wider text-charcoal-text/60 mt-0.5">
                Chỉ số
              </span>
            </div>

            <div className="mt-4">
              {score >= 85 ? (
                <p className="text-xs text-emerald-700 font-sans font-medium flex items-center justify-center gap-1">
                  <CheckCircle className="w-4 h-4" /> Tuyệt vời! Cây sẽ phát triển hoa rực rỡ
                </p>
              ) : score >= 60 ? (
                <p className="text-xs text-amber-700 font-sans font-medium flex items-center justify-center gap-1">
                  <AlertTriangle className="w-4 h-4" /> Tạm ổn, cần tinh chỉnh thêm vài thông số
                </p>
              ) : (
                <p className="text-xs text-red-700 font-sans font-medium flex items-center justify-center gap-1">
                  <AlertTriangle className="w-4 h-4" /> Cảnh báo: Nguy cơ hao hụt giống cao!
                </p>
              )}
            </div>
          </div>

          {/* Detailed Diagnosis bullets */}
          <div className="flex-1 py-5 space-y-4 max-h-[220px] overflow-y-auto">
            <h5 className="text-[11px] uppercase tracking-wider text-charcoal-text font-bold font-sans">
              Báo cáo vi khí hậu & Chẩn đoán bệnh lý:
            </h5>

            {advisories.length > 0 ? (
              <div className="space-y-3">
                {advisories.map((adv, index) => (
                  <div key={index} className="flex gap-2.5 text-xs text-on-surface-variant font-sans leading-relaxed">
                    <ChevronRight className="w-4 h-4 text-antique-gold shrink-0 mt-0.5" />
                    <span>{adv}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center text-center p-6 bg-white/40 border border-emerald-500/10 rounded">
                <Smile className="w-8 h-8 text-emerald-600 mb-1.5" />
                <p className="text-xs font-sans text-emerald-800 leading-relaxed font-semibold">
                  Môi trường tuyệt diệu! Các thông số nuôi dưỡng của bạn mô phỏng chính xác thung lũng ẩm nơi cây phát nguyên sinh bản địa.
                </p>
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-surface-container-high flex justify-between items-center text-[10px] text-on-surface-variant/60 font-sans">
            <span className="flex items-center gap-1">
              <Info className="w-3.5 h-3.5 text-antique-gold" />
              Khuyến cáo khoa học thực nghiệm
            </span>
            <button
              onClick={() => {
                setWateringDays(7);
                setLightHours(4);
                setSoilType("moss");
                setLocationType("indoor_light");
              }}
              className="text-botanical-green hover:underline flex items-center gap-1 font-semibold cursor-pointer"
            >
              <RefreshCw className="w-3 h-3" /> Thiết lập chuẩn
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
