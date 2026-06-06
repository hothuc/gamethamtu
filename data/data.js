const locations = [
  ["Living Room( Phòng khách)", "Bedroom( Phòng ngủ)", "Storeroom( Kho)", "Bathroom( Phòng tắm)", "Kitchen( Nhà bếp)", "Balcony( Ban công)"],
  ["Vacation Home( Nhà nghỉ)", "Park( Công viên)", "Supermarket( Siêu thị)", "School( Trường học)", "Woods( Rừng)", "Bank( Ngân hàng)"],
  ["Pub( Quán rượu)", "Bookstore( Hiệu sách)", "Restaurant( Nhà hàng)", "Hotel( Khách sạn)", "Hospital( Bệnh viện)", "Building Site( Công trường)"],
  ["Playground( Sân chơi)", "Classroom( Lớp học)", "Dormitory( Ký túc xá)", "Cafeteria( Căng tin)", "Elevator( Thang máy)", "Toilet( Nhà vệ sinh)"]
];

const causeOfDeathTile = [
  "Suffocation( Ngạt thở)", "Severe Injury( Chấn thương nặng)", "Loss of Blood( Mất máu)",
  "Illness/ Disease( Bệnh tật)", "Poisoning( Trúng độc)", "Accident( Tai nạn)"
];

const eventTiles = [
  ["Brown( Nâu)", "Motive of Crime( Động cơ tội phạm)", "Hatred( Thù hận)", "Power( Quyền lực)", "Money( Tiền bạc)", "Love( Tình yêu)", "Jealousy( Ghen tuông)", "Justice( Công lý)"],
  ["Brown( Nâu)", "Weather( Thời tiết)", "Sunny( Nắng)", "Stormy( Bão)", "Dry( Khô)", "Humid( Ẩm)", "Cold( Lạnh)", "Hot( Nóng)"],
  ["Brown( Nâu)", "Hint on Corpse( Manh mối trên thi thể)", "Head( Đầu)", "Chest( Ngực)", "Hand( Tay)", "Leg( Chân)", "Partial( Một phần)", "All-over( Toàn thân)"],
  ["Brown( Nâu)", "General Impression( Ấn tượng chung)", "Common( Bình thường)", "Creative( Sáng tạo)", "Fishy( Đáng ngờ)", "Cruel( Tàn nhẫn)", "Horrible( Khủng khiếp)", "Suspenseful( Hồi hộp)"],
  ["Brown( Nâu)", "Corpse Condition( Tình trạng thi thể)", "Still Warm( Còn ấm)", "Stiff( Cứng)", "Decayed( Phân hủy)", "Incomplete( Không nguyên vẹn)", "Intact( Nguyên vẹn)", "Twisted( Biến dạng)"],
  ["Brown( Nâu)", "Victim's Identity( Thân phận nạn nhân)", "Child( Trẻ em)", "Young Adult( Thanh niên)", "Middle-Aged( Trung niên)", "Senior( Cao tuổi)", "Male( Nam)", "Female( Nữ)"],
  ["Brown( Nâu)", "Murderer's Personality( Tính cách hung thủ)", "Arrogant( Kiêu ngạo)", "Despicable( Đê tiện)", "Furious( Hung bạo)", "Greedy( Tham lam)", "Forceful( Cưỡng bức)", "Perverted( Biến thái)"],
  ["Brown( Nâu)", "State of The Scene( Hiện trường)", "Bits and Pieces( Vụn vặt)", "Ashes( Tro tàn)", "Water Stain( Vết nước)", "Cracked( Nứt vỡ)", "Disorderly( Lộn xộn)", "Tidy( Gọn gàng)"],
  ["Brown( Nâu)", "Victim's Build( Thể hình nạn nhân)", "Large( To lớn)", "Thin( Gầy)", "Tall( Cao)", "Short( Thấp)", "Disfigured( Dị dạng)", "Fit( Cơ bắp)"],
  ["Brown( Nâu)", "Victim's Clothes( Trang phục nạn nhân)", "Neat( Gọn gàng)", "Untidy( Lộn xộn)", "Elegant( Thanh lịch)", "Shabby( Tồi tàn)", "Bizarre( Kỳ quái)", "Naked( Không mặc)"],
  ["Brown( Nâu)", "Evidence Left Behind( Dấu vết để lại)", "Natural( Tự nhiên)", "Artistic( Nghệ thuật)", "Written( Chữ viết)", "Synthetic( Nhân tạo)", "Personal( Cá nhân)", "Unrelated( Không liên quan)"],
  ["Brown( Nâu)", "Victim's Expression( Biểu cảm nạn nhân)", "Peaceful( Bình thản)", "Struggling( Giãy giụa)", "Frightened( Sợ hãi)", "In Pain( Đau đớn)", "Blank( Trống rỗng)", "Angry( Giận dữ)"],
  ["Brown( Nâu)", "Time of Death( Thời điểm chết)", "Dawn( Bình minh)", "Morning( Buổi sáng)", "Noon( Trưa)", "Afternoon( Chiều)", "Evening( Tối)", "Midnight( Nửa đêm)"],
  ["Brown( Nâu)", "Duration of Crime( Thời gian phạm tội)", "Instanteous( Tức thì)", "Brief( Ngắn)", "Gradual( Từ từ)", "Prolonged( Kéo dài)", "Few Days( Vài ngày)", "Unclear( Không rõ)"],
  ["Brown( Nâu)", "Trace at the Scene( Dấu vết hiện trường)", "Fingerprint( Vân tay)", "Footprint( Dấu chân)", "Bruise( Vết bầm)", "Blood Stain( Vết máu)", "Body Fluid( Dịch cơ thể)", "Scar( Vết sẹo)"],
  ["Brown( Nâu)", "Noticed by Bystander( Người chứng kiến nhận thấy)", "Sudden sound( Âm thanh đột ngột)", "Prolonged sound( Âm thanh kéo dài)", "Smell( Mùi)", "Visual( Hình ảnh)", "Action( Hành động)", "Nothing( Không có gì)"],
  ["Brown( Nâu)", "Social Relationship( Quan hệ xã hội)", "Relatives( Người thân)", "Friends( Bạn bè)", "Colleagues( Đồng nghiệp)", "Employer/ Employee( Chủ/ Nhân viên)", "Lovers( Người yêu)", "Strangers( Người lạ)"],
  ["Brown( Nâu)", "Victim's Occupation( Nghề nghiệp nạn nhân)", "Boss( Sếp)", "Professional( Chuyên gia)", "Worker( Công nhân)", "Student( Học sinh)", "Unemployed( Thất nghiệp)", "Retired( Nghỉ hưu)"],
  ["Brown( Nâu)", "In Progress( Đang làm gì)", "Entertainment( Giải trí)", "Relaxation( Nghỉ ngơi)", "Assembly( Tụ họp)", "Trading( Giao dịch)", "Visit( Thăm viếng)", "Dining( Ăn uống)"],
  ["Brown( Nâu)", "Sudden Incident( Sự cố đột ngột)", "Power Failure( Mất điện)", "Fire( Hỏa hoạn)", "Conflict( Xung đột)", "Loss of Valuables( Mất đồ quý)", "Scream( Tiếng la hét)", "Nothing( Không có gì)"],
  ["Brown( Nâu)", "Day of Crime( Ngày phạm tội)", "Weekday( Ngày thường)", "Weekend( Cuối tuần)", "Spring( Mùa xuân)", "Summer( Mùa hè)", "Autumn( Mùa thu)", "Winter( Mùa đông)"],
  ["Special( Đặc biệt)", "Countdown( Đếm ngược)", "The Forensic Scientist draws 2 scene tiles and substitutes them...( Nhà khoa học pháp y rút 2 thẻ hiện trường và thay thế chúng...)"],
  ["Special( Đặc biệt)", "Erroneous Information( Thông tin sai lệch)", "The Forensic Scientist chooses 1 scene tile and changes it...( Nhà khoa học pháp y chọn 1 thẻ hiện trường và thay đổi nó...)"],
  ["Special( Đặc biệt)", "A Good Twist( Bước ngoặt hay)", "Previous winner gets a bonus guess...( Người thắng ván trước được đoán thêm một lần...)"],
  ["Special( Đặc biệt)", "A Useful Clue( Manh mối hữu ích)", "Forensic draws 5 new scene tiles...( Nhà khoa học pháp y rút 5 thẻ hiện trường mới...)"],
  ["Special( Đặc biệt)", "Ruled Out Evidence( Loại trừ bằng chứng)", "Each player flips one of their own clue cards...( Mỗi người chơi lật một thẻ manh mối của mình...)"],
  ["Special( Đặc biệt)", "Secret Testimony( Lời khai bí mật)", "Witness points at a tile to eliminate...( Nhân chứng chỉ vào một ô để loại trừ...)"]
];

if (typeof module !== 'undefined') {
  module.exports = { locations, causeOfDeathTile, eventTiles };
}
