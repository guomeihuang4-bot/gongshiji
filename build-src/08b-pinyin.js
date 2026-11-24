/* =====================================================================
   拼音字库（6769 个汉字，400 个音节，同一音节内按常用度排序）
   仅用于内置键盘的拼音输入，不联网
   ===================================================================== */
const PY_DATA = {
  "a":"啊阿腌锕",
  "ai":"爱埃挨哎唉哀皑癌蔼矮艾碍隘捱嗳嫒瑷暧砹锿霭",
  "an":"安案按暗鞍氨俺岸胺谙埯揞庵桉铵鹌黯",
  "ang":"肮昂盎",
  "ao":"奥凹敖熬翱袄傲懊澳坳艹拗嗷岙廒遨媪骜獒聱螯鏊鳌鏖",
  "ba":"把巴爸吧八芭捌扒叭笆疤拔跋靶耙坝霸罢茇菝岜灞钯粑鲅魃",
  "bai":"白百败柏摆佰拜稗捭掰",
  "ban":"半办般班板伴斑搬扳颁版扮拌瓣绊阪坂钣瘢癍舨",
  "bang":"帮邦梆榜膀绑棒磅蚌镑傍谤蒡浜",
  "bao":"报保包抱宝苞胞褒剥薄雹堡饱暴豹鲍爆勹葆孢煲鸨褓趵龅",
  "bei":"被北备背贝悲杯碑卑辈钡倍狈惫焙孛陂邶蓓呗庳悖碚鹎褙鐾鞴",
  "ben":"本奔苯笨畚坌锛犇",
  "beng":"崩绷甭泵蹦迸嘣甏",
  "bi":"比必笔毕臂逼鼻鄙彼碧蓖蔽毙毖币庇痹闭敝弊辟壁避陛匕俾芘荜荸萆薜哔狴愎滗濞弼妣婢嬖璧贲睥畀铋秕裨筚箅篦舭襞跸髀",
  "bian":"便边变遍编鞭贬扁卞辨辩辫匾弁苄忭汴缏煸砭碥窆褊蝙笾鳊",
  "biao":"表标彪膘婊飑飙飚镖镳瘭裱鳔髟骉",
  "bie":"别鳖憋瘪蹩",
  "bin":"彬斌濒滨宾摈傧豳缤玢槟殡膑镔髌鬓",
  "bing":"并病兵冰柄丙秉饼炳禀冫邴摒",
  "bo":"波伯博玻菠播拨钵勃搏铂箔帛舶脖膊渤泊驳亳啵饽檗擘礴钹鹁簸跛踣",
  "bu":"不部布步捕卜哺补埠簿怖卟逋瓿晡钚钸醭",
  "ca":"擦嚓礤",
  "cai":"才采彩财菜猜裁材睬踩蔡",
  "can":"参餐蚕残惭惨灿骖璨粲黪",
  "cang":"藏苍舱仓沧伧",
  "cao":"草操糙槽曹嘈漕螬艚",
  "ce":"厕策侧册测恻",
  "cen":"岑涔",
  "ceng":"层蹭噌",
  "cha":"查察差插叉茬茶碴搽岔诧刹猹馇汊姹杈槎檫锸镲衩",
  "chai":"拆柴豺侪钗瘥虿",
  "chan":"产搀掺蝉馋谗缠铲阐颤冁谄蒇廛忏潺澶孱羼婵骣觇禅蟾躔",
  "chang":"长常场唱昌猖尝偿肠厂敞畅倡裳伥鬯苌菖徜怅惝阊娼嫦昶氅鲳",
  "chao":"超抄钞嘲潮巢吵炒怊晁耖",
  "che":"车扯撤掣彻澈坼屮砗",
  "chen":"沉陈郴臣辰尘晨忱趁衬谌谶抻嗔宸琛榇碜龀",
  "cheng":"成称城程承撑橙呈乘惩澄诚逞骋秤丞埕枨柽塍瞠铖裎蛏酲",
  "chi":"吃持痴匙池迟弛驰耻齿侈尺赤翅斥炽傺墀茌叱哧啻嗤彳饬媸敕眵鸱瘛褫蚩螭笞篪豉踟魑",
  "chong":"充冲虫崇宠茺忡憧铳舂艟",
  "chou":"抽酬畴踌稠愁筹仇绸瞅丑臭俦帱惆瘳雠",
  "chu":"出处除初橱厨躇锄雏滁楚础储矗搐触亍刍怵憷绌杵楮樗蜍蹰黜",
  "chuai":"揣搋膪踹",
  "chuan":"传穿船川椽喘串舛遄巛氚钏舡",
  "chuang":"创床窗疮幢闯怆",
  "chui":"吹炊捶锤垂陲棰槌",
  "chun":"春椿醇唇淳纯蠢莼鹑蝽",
  "chuo":"戳绰啜辶辍踔龊",
  "ci":"次此词疵茨磁雌辞慈瓷刺赐祠鹚糍",
  "cong":"从聪葱囱匆丛苁淙骢琮璁枞",
  "cou":"凑楱辏腠",
  "cu":"粗醋簇促蔟徂猝殂蹙蹴",
  "cuan":"蹿篡窜汆撺爨镩",
  "cui":"摧崔催脆瘁粹淬翠萃啐悴璀榱毳",
  "cun":"存村寸忖皴",
  "cuo":"错磋撮搓措挫厝嵯脞锉矬痤鹾蹉",
  "da":"大打达答搭瘩耷哒怛妲褡笪靼鞑",
  "dai":"代带待戴袋呆歹傣殆贷逮怠埭甙呔岱迨绐玳黛",
  "dan":"但单担弹耽丹郸掸胆旦氮惮淡诞蛋儋萏啖澹殚赕眈疸瘅聃箪",
  "dang":"当党挡荡档谠凼菪宕砀铛裆",
  "dao":"到道倒导岛刀捣蹈祷稻悼盗刂忉氘焘纛",
  "de":"的得德锝",
  "deng":"等登灯蹬瞪凳邓噔嶝戥磴镫簦",
  "di":"地第底帝弟低堤滴迪敌笛狄涤翟嫡抵蒂递缔氐籴诋谛邸坻荻嘀娣柢棣觌砥碲睇镝羝骶",
  "dia":"嗲",
  "dian":"点电店典颠掂滇碘靛垫佃甸惦奠淀殿阽坫巅玷钿癜癫簟踮",
  "diao":"掉碉叼雕凋刁吊钓铞铫貂鲷",
  "die":"跌爹碟蝶迭谍叠垤堞喋牒瓞耋蹀鲽",
  "ding":"定顶丁盯叮钉鼎锭订仃啶玎腚碇疔耵酊",
  "diu":"丢铥",
  "dong":"动东懂冬董栋侗恫冻洞垌咚岽氡胨胴硐鸫",
  "dou":"斗兜抖陡豆逗痘蔸钭窦蚪篼",
  "du":"都度读独督毒犊堵睹赌杜镀肚渡妒芏嘟渎椟牍蠹笃髑黩",
  "duan":"断段短端锻缎椴煅簖",
  "dui":"对队堆兑怼憝碓镦",
  "dun":"顿墩吨蹲敦囤钝盾遁沌炖砘礅盹趸",
  "duo":"多掇哆夺垛躲朵跺舵剁惰堕咄哚缍铎裰踱",
  "e":"恶蛾峨鹅俄额讹娥厄扼遏鄂饿噩谔垩苊莪萼呃愕阏屙婀轭腭锇锷鹗颚鳄",
  "ei":"诶",
  "en":"恩蒽摁",
  "er":"而儿耳尔饵洱二贰佴迩珥铒鸸鲕",
  "fa":"发法罚筏伐乏阀珐垡砝",
  "fan":"反饭范犯翻凡藩帆番樊矾钒繁烦返贩泛蕃蘩幡梵燔畈蹯",
  "fang":"方放房坊芳肪防妨仿访纺匚邡枋钫舫鲂",
  "fei":"非飞费菲啡肥匪诽吠肺废沸芾狒悱淝妃绯榧腓斐扉镄痱蜚篚翡霏鲱",
  "fen":"分份芬酚吩氛纷坟焚汾粉奋忿愤粪偾瀵棼鲼鼢",
  "feng":"风封丰枫蜂峰锋疯烽逢冯缝讽奉凤俸酆葑唪沣砜",
  "fo":"佛",
  "fou":"否缶",
  "fu":"夫父福妇复富府负付副敷肤孵扶拂辐幅氟符伏俘服浮涪袱弗甫抚辅俯釜斧脯腑腐赴覆赋傅阜腹讣附缚咐匐凫阝郛芙苻茯莩菔拊呋呒幞怫滏艴孚驸绂绋桴赙祓砩黻黼罘稃馥蚨蜉蝠蝮麸趺跗鲋鳆",
  "ga":"噶嘎尬尕尜旮钆",
  "gai":"该改盖概钙溉丐陔垓戤赅",
  "gan":"感干赶敢甘杆柑竿肝秆赣坩苷尴擀泔淦澉绀橄旰矸疳酐",
  "gang":"刚冈钢缸肛纲岗港杠戆罡筻",
  "gao":"高告篙皋膏羔糕搞镐稿睾诰郜藁缟槔槁杲锆",
  "ge":"个格各歌哥革搁戈鸽胳疙割葛蛤阁隔铬鬲哿圪塥嗝搿膈镉袼虼舸骼",
  "gei":"给",
  "gen":"根跟亘茛哏艮",
  "geng":"更耕庚羹埂耿梗哽赓绠鲠",
  "gong":"公工共功宫供攻恭龚躬弓巩汞拱贡廾珙肱蚣觥",
  "gou":"够狗钩勾沟苟垢构购佝诟岣遘媾缑觏彀笱篝鞲",
  "gu":"古故顾姑骨孤辜菇咕箍估沽鼓蛊谷股固雇嘏诂菰崮汩梏轱牯牿臌毂瞽罟钴锢鸪痼蛄酤觚鲴鹘",
  "gua":"刮瓜剐寡挂褂卦诖呱栝胍鸹",
  "guai":"怪乖拐",
  "guan":"关管观官馆棺冠罐惯灌贯倌莞掼涫盥鹳鳏",
  "guang":"光广逛咣犷桄胱",
  "gui":"贵规归瑰圭硅龟闺轨鬼诡癸桂柜跪刽匦刿庋宄妫桧晷眭皈簋鲑鳜",
  "gun":"辊滚棍丨衮绲磙鲧",
  "guo":"国过果锅郭裹馘埚掴帼崞猓椁虢聒蜾蝈",
  "ha":"哈铪",
  "hai":"孩海害骸氦亥骇嗨胲醢",
  "han":"汉喊含酣憨邯韩涵寒函罕翰撼捍旱憾悍焊汗邗菡撖犴瀚晗焓顸颔蚶鼾",
  "hang":"行夯杭航吭沆绗颃",
  "hao":"好号毫壕嚎豪郝耗浩蒿薅嗥嚆濠灏昊皓颢蚝",
  "he":"和何合河喝呵荷菏核禾盒貉阂涸赫褐鹤贺诃劾壑嗬阖纥曷盍颌翮",
  "hei":"黑嘿",
  "hen":"很痕狠恨",
  "heng":"哼亨横衡恒蘅珩桁",
  "hong":"红轰哄烘虹鸿洪宏弘黉訇讧荭蕻薨闳泓",
  "hou":"后候喉侯猴吼厚堠後逅瘊篌糇鲎骺",
  "hu":"乎呼护胡忽瑚壶葫蝴狐糊湖弧虎唬互沪户冱唿囫岵猢怙惚浒滹琥槲轷觳烀煳戽扈祜瓠鹄鹕鹱虍笏醐斛",
  "hua":"话花化画华划哗猾滑骅桦铧",
  "huai":"怀坏槐徊淮踝",
  "huan":"还欢环换桓缓患唤痪豢焕涣宦幻奂萑擐圜獾洹浣漶寰逭缳锾鲩鬟",
  "huang":"黄皇荒慌磺蝗簧凰惶煌晃幌恍谎隍徨湟潢遑璜肓癀蟥篁鳇",
  "hui":"会回挥灰辉徽恢蛔毁悔慧卉惠晦贿秽烩汇讳诲绘诙茴荟蕙咴喙隳洄彗缋晖恚睢虺蟪麾",
  "hun":"婚荤昏魂浑混诨馄阍溷珲",
  "huo":"活或火获伙豁惑霍货祸劐藿攉嚯夥灬钬锪镬耠蠖",
  "ji":"己几机记即及极计纪基际激集急击级继吉既技迹籍济圾畸稽积箕肌饥讥鸡姬绩缉棘辑疾汲嫉挤脊蓟冀季伎祭剂悸寄寂忌妓亟乩剞佶偈墼芨芰荠蒺蕺掎叽咭哜唧岌嵴洎彐屐骥畿玑楫殛戟戢赍觊犄齑矶羁嵇稷瘠虮笈笄暨跻跽霁鲚鲫髻麂",
  "jia":"家加价假架嘉枷夹佳荚颊贾甲钾稼驾嫁郏葭岬浃迦珈戛胛恝铗镓痂瘕袷蛱笳袈跏",
  "jian":"间见建简渐坚健艰歼监尖笺煎兼肩奸缄茧检柬碱硷拣捡俭剪减荐槛鉴践贱键箭件舰剑饯溅涧僭谏谫菅蒹搛囝湔蹇謇缣枧楗戋戬牮犍毽腱睑锏鹣裥笕翦趼踺鲣鞯",
  "jiang":"将讲奖降江僵姜浆疆蒋桨匠酱茳洚绛缰犟礓耩糨豇",
  "jiao":"教叫交脚角较蕉椒礁焦胶郊浇骄娇嚼搅铰矫侥狡饺缴绞剿酵轿窖佼僬艽茭挢噍峤徼姣敫皎鹪蛟醮跤鲛",
  "jie":"界结接解节姐街杰介揭皆秸阶截劫捷睫竭洁戒藉芥借疥诫届讦诘卩拮喈嗟婕孑桀碣疖颉蚧羯鲒骱",
  "jin":"进金今近尽紧仅禁巾筋斤津襟锦谨靳晋烬浸劲卺荩堇噤馑廑妗缙瑾槿赆觐钅衿矜",
  "jing":"经精惊静竟京睛境警景荆兢茎晶鲸粳井颈敬镜径痉靖竞净刭儆阱菁獍憬泾迳弪婧肼胫腈旌靓",
  "jiong":"炯窘冂迥炅扃囧",
  "jiu":"就久酒究救旧九揪纠玖韭灸厩臼舅咎疚僦啾阄柩桕鸠鹫赳鬏",
  "ju":"举句居具据剧局巨桔鞠拘狙疽驹菊咀矩沮聚拒距踞锯俱惧炬倨讵苣苴莒掬遽屦琚枸椐榘榉橘犋飓钜锔窭裾醵踽龃雎鞫",
  "juan":"捐鹃娟倦眷卷绢鄄狷涓桊蠲锩镌",
  "jue":"觉决绝撅攫抉掘倔爵诀厥劂谲矍蕨噘噱崛獗孓珏桷橛爝镢蹶觖",
  "jun":"军均菌钧君峻俊竣浚郡骏捃皲隽麇珺",
  "ka":"卡喀咖咯佧咔胩",
  "kai":"开揩楷凯慨剀垲蒈忾恺铠锎锴",
  "kan":"看刊堪勘坎砍侃凵莰阚戡龛瞰",
  "kang":"康慷糠扛抗亢炕伉闶钪",
  "kao":"考靠拷烤尻栲犒铐",
  "ke":"可克科客刻课坷苛柯棵磕颗壳咳渴嗑岢恪溘骒缂珂轲氪瞌钶锞稞疴窠颏蚵蝌髁",
  "ken":"肯啃垦恳裉",
  "keng":"坑铿",
  "kong":"空恐孔控倥崆箜",
  "kou":"口抠扣寇芤蔻叩眍筘",
  "ku":"苦哭枯窟酷库裤刳堀喾绔骷",
  "kua":"夸垮挎跨胯侉",
  "kuai":"快块筷侩蒯郐哙狯浍脍",
  "kuan":"宽款髋",
  "kuang":"况匡筐狂框矿眶旷诓诳邝圹夼哐纩贶",
  "kui":"亏盔岿窥葵奎魁傀馈愧溃馗匮夔蒉揆喹喟悝愦逵暌睽聩蝰篑跬",
  "kun":"困坤昆捆悃阃琨锟醌鲲髡",
  "kuo":"括扩廓阔蛞",
  "la":"拉垃喇蜡腊辣啦剌邋旯瘌",
  "lai":"来莱赖崃徕涞濑赉睐铼癞籁",
  "lan":"兰蓝婪栏拦篮阑澜谰揽览懒缆烂滥啉岚漤榄斓罱镧褴",
  "lang":"浪琅榔狼廊郎朗莨蒗啷阆锒稂螂",
  "lao":"老劳捞牢佬酪烙涝潦唠崂栳铑铹痨耢醪",
  "le":"了乐勒仂叻泐鳓",
  "lei":"类泪雷镭蕾磊累儡垒擂肋羸诔嘞嫘缧檑耒酹",
  "leng":"冷棱楞塄愣",
  "li":"里力理利立离丽历礼李例厘梨犁黎篱狸漓鲤莉荔吏栗厉励砾傈俐痢粒沥隶璃哩俪俚郦坜苈莅蓠藜呖唳喱猁溧澧逦娌嫠骊缡枥栎轹戾砺砬詈罹锂鹂疠疬蛎蜊蠡笠篥粝醴跞雳鲡鳢黧",
  "lian":"连脸联练恋莲镰廉怜涟帘敛链炼蔹奁潋濂琏楝殓臁裢裣蠊鲢",
  "liang":"两量亮良俩粮凉梁粱辆晾谅墚椋踉魉",
  "liao":"料撩聊僚疗燎寥辽撂镣廖蓼尥嘹獠寮缭钌鹩",
  "lie":"列烈裂劣猎冽埒捩咧洌趔躐鬣",
  "lin":"林临琳磷霖邻鳞淋凛赁吝拎蔺嶙廪懔遴檩辚膦瞵粼躏麟",
  "ling":"令领另灵玲菱零龄铃伶羚凌陵岭酃苓呤囹泠绫柃棂瓴聆蛉翎鲮",
  "liu":"流留六刘溜琉榴硫馏瘤柳浏遛骝绺旒熘锍镏鹨鎏",
  "long":"龙聋咙笼窿隆垄拢陇垅茏泷珑栊胧砻癃",
  "lou":"露楼娄搂篓漏陋蒌喽嵝镂瘘耧蝼髅",
  "lu":"路鲁录芦卢颅庐炉掳卤虏麓碌赂鹿潞禄陆戮垆撸噜泸渌漉逯璐栌橹轳辂辘氇胪镥鸬鹭簏舻鲈",
  "luan":"乱峦挛孪滦卵脔娈栾鸾銮",
  "lun":"论伦抡轮仑沦纶囵",
  "luo":"罗落洛萝螺逻锣箩骡裸骆络倮蠃荦捋摞猡泺漯珞椤脶硌镙瘰雒",
  "lv":"旅律驴吕铝侣履屡缕虑氯滤绿偻闾榈膂稆褛",
  "lve":"掠略锊",
  "ma":"马妈吗玛麻码蚂骂嘛犸杩蟆",
  "mai":"买卖埋麦迈脉劢荬唛霾",
  "man":"满慢瞒馒蛮蔓曼漫谩墁幔缦熳镘颟螨鳗鞔",
  "mang":"忙芒茫盲氓莽邙漭硭蟒",
  "mao":"毛猫茅锚矛铆卯茂冒帽貌贸袤茆峁泖瑁昴牦耄旄懋瞀蝥蟊髦",
  "mei":"没美每妹玫枚梅酶霉煤眉媒镁昧寐媚莓嵋猸浼湄楣镅鹛袂魅",
  "men":"们门闷扪焖懑钔",
  "meng":"梦蒙萌檬盟锰猛孟勐甍瞢懵朦礞虻蜢蠓艋艨",
  "mi":"米密秘迷眯醚靡糜谜弥觅泌蜜幂芈冖谧蘼咪嘧猕汨宓弭脒祢敉糸縻麋",
  "mian":"面免棉眠绵冕勉娩缅沔渑湎宀腼眄",
  "miao":"妙苗描瞄藐秒渺庙喵邈缈杪淼眇鹋",
  "mie":"蔑灭乜咩蠛篾",
  "min":"民抿皿敏悯闽苠岷闵泯缗玟珉愍黾鳘",
  "ming":"名明命螟鸣铭冥茗溟暝瞑酩",
  "miu":"谬",
  "mo":"么默莫模摸摹蘑膜磨摩魔抹末墨沫漠寞陌谟茉蓦馍嫫嬷殁镆秣瘼耱貊貘麽",
  "mou":"某谋牟侔哞缪眸蛑鍪",
  "mu":"母目木姆姥拇牡亩墓暮幕募慕睦牧穆仫坶苜沐毪钼",
  "na":"那拿哪纳娜呐钠捺肭镎衲",
  "nai":"奶氖乃耐奈鼐艿萘柰",
  "nan":"难男南喃囡楠腩蝻赧",
  "nang":"囊攮囔馕曩",
  "nao":"脑挠恼闹淖孬垴呶猱瑙硇铙蛲",
  "ne":"呢讷疒",
  "nei":"内馁",
  "nen":"嫩恁",
  "neng":"能",
  "ng":"嗯",
  "ni":"你尼妮霓倪泥拟匿腻逆溺伲坭猊怩昵旎睨铌鲵",
  "nian":"年念蔫拈碾撵捻粘廿埝辇黏鲇鲶",
  "niang":"娘酿",
  "niao":"鸟尿茑嬲脲袅",
  "nie":"捏聂孽啮镊镍涅陧蘖嗫颞臬蹑",
  "nin":"您",
  "ning":"柠狞凝宁拧泞佞咛甯聍",
  "niu":"牛扭钮纽狃忸妞",
  "nong":"农弄脓浓侬哝",
  "nou":"耨",
  "nu":"奴努怒弩胬孥驽",
  "nuan":"暖",
  "nuo":"诺挪懦糯傩搦喏锘",
  "nv":"女恧钕衄",
  "nve":"虐疟",
  "o":"哦喔噢",
  "ou":"欧鸥殴藕呕偶沤讴怄瓯耦",
  "pa":"怕啪趴爬帕琶葩杷筢",
  "pai":"排派拍牌徘湃俳蒎哌",
  "pan":"判攀潘盘磐盼畔叛拚丬爿泮袢襻蟠蹒",
  "pang":"旁乓庞耪胖彷滂逄螃",
  "pao":"跑抛咆刨炮袍泡匏狍庖脬疱",
  "pei":"呸胚培裴赔陪配佩沛辔帔旆锫醅霈",
  "pen":"喷盆湓",
  "peng":"朋砰抨烹澎彭蓬棚硼篷膨鹏捧碰堋嘭怦蟛",
  "pi":"皮批坯砒霹披劈琵毗啤脾疲匹痞僻屁譬丕仳陴邳郫圮埤鼙擗吡噼庀淠媲纰枇甓罴铍癖疋蚍蜱貔",
  "pian":"片篇偏骗谝骈犏胼翩蹁",
  "piao":"票飘漂瓢剽嘌嫖骠缥殍瞟螵",
  "pie":"撇瞥丿苤氕",
  "pin":"品拼频贫聘姘嫔榀牝颦",
  "ping":"平乒坪苹萍凭瓶评屏俜娉枰鲆",
  "po":"破坡泼颇婆魄迫粕叵鄱珀钋钷皤笸",
  "pou":"剖裒掊",
  "pu":"普扑铺仆莆葡菩蒲埔朴圃浦谱曝瀑匍噗溥濮璞攴氆攵镤镨蹼",
  "qi":"起期其气奇妻器七汽棋欺栖戚凄漆柒沏歧畦崎脐齐旗祈祁骑岂乞企启契砌迄弃泣讫丌亓圻芑芪萁萋葺蕲嘁屺岐汔淇骐绮琪琦杞桤槭耆欹祺憩碛颀蛴蜞綦蹊鳍麒",
  "qia":"掐恰洽葜髂",
  "qian":"前钱千牵扦钎铅迁签仟谦乾黔钳潜遣浅谴堑嵌欠歉倩佥阡芊芡茜荨掮岍悭慊骞搴褰缱椠肷愆钤虔箝",
  "qiang":"强枪呛腔羌墙蔷抢戕嫱樯戗炝锖锵镪襁蜣羟跄",
  "qiao":"橇锹敲悄桥瞧乔侨巧鞘撬翘峭俏窍劁诮谯荞愀憔缲樵硗跷鞒",
  "qie":"切且茄怯窃伽郄惬妾挈锲箧趄",
  "qin":"亲琴钦侵秦勤芹擒禽寝沁芩揿吣嗪噙檎锓螓衾",
  "qing":"情轻清请青氢倾卿擎晴氰顷庆苘圊檠磬蜻罄箐綮謦鲭黥",
  "qiong":"琼穷邛茕穹蛩筇跫銎",
  "qiu":"求球秋丘邱囚酋泅俅巯犰湫逑遒楸赇虬蚯蝤裘糗鳅鼽",
  "qu":"去取趣区曲趋蛆躯屈驱渠娶龋诎劬蕖蘧岖衢阒璩觑氍朐祛磲鸲癯蛐蠼麴瞿黢",
  "quan":"全权圈颧醛泉痊拳犬券劝诠荃犭悛绻辁畎铨蜷筌鬈",
  "que":"却确缺炔瘸鹊榷雀阕阙悫",
  "qun":"群裙逡",
  "ran":"然燃冉染苒蚺髯",
  "rang":"让瓤壤攘嚷禳穰",
  "rao":"饶扰绕荛娆桡",
  "re":"热惹",
  "ren":"人认任忍壬仁韧刃妊纫亻仞荏饪轫稔衽",
  "reng":"仍扔",
  "ri":"日",
  "rong":"容戎茸蓉荣融熔溶绒冗嵘狨榕肜蝾",
  "rou":"肉揉柔糅蹂鞣",
  "ru":"如入茹蠕儒孺辱乳汝褥蓐薷嚅洳溽濡缛铷襦颥",
  "ruan":"软阮朊",
  "rui":"蕊瑞锐芮蕤枘睿蚋",
  "run":"闰润",
  "ruo":"若弱偌箬",
  "sa":"萨撒洒卅仨脎飒",
  "sai":"赛塞腮鳃噻",
  "san":"三散叁伞馓毵糁",
  "sang":"桑嗓丧搡磉颡",
  "sao":"搔骚扫嫂埽缫臊瘙鳋",
  "se":"色瑟涩啬铯穑",
  "sen":"森",
  "seng":"僧",
  "sha":"沙杀砂纱傻啥煞厦唼嗄歃铩痧裟霎鲨",
  "shai":"筛晒",
  "shan":"山善珊苫杉删煽衫闪陕擅赡膳汕扇缮讪鄯芟彡潸姗嬗骟膻钐疝蟮舢跚鳝",
  "shang":"上伤商墒赏晌尚垧绱殇熵觞",
  "shao":"少烧梢捎稍芍勺韶哨邵绍劭潲杓筲艄",
  "she":"社设奢赊蛇舌舍赦摄射慑涉厍佘揲猞滠畲麝",
  "shen":"身神深甚砷申呻伸娠绅沈审婶肾慎渗诜谂莘葚哂渖胂矧蜃",
  "sheng":"生声圣胜升盛甥牲绳省剩嵊晟眚笙",
  "shi":"是时事世什使十实师失士始视识市式石示史诗室食试适势释狮施湿尸虱拾蚀矢屎驶柿拭誓逝嗜噬仕侍饰氏恃谥埘莳蓍弑饣轼贳炻礻铈螫舐筮酾豕鲥鲺",
  "shou":"手受收首守授寿售瘦兽扌狩绶艏",
  "shu":"书数术树属束熟蔬枢梳殊抒输叔舒淑疏赎孰薯暑曙署蜀黍鼠述戍竖墅庶漱恕倏塾菽摅沭澍姝纾毹腧殳秫",
  "shua":"刷耍唰",
  "shuai":"率摔衰甩帅蟀",
  "shuan":"栓拴闩涮",
  "shuang":"双霜爽孀",
  "shui":"水谁睡税氵",
  "shun":"顺吮瞬舜",
  "shuo":"说硕朔烁蒴搠妁槊铄",
  "si":"死四思司似丝斯撕嘶私肆寺嗣伺饲巳厮俟兕厶咝汜泗澌姒驷纟缌祀锶鸶耜蛳笥",
  "song":"送松耸怂颂宋讼诵凇菘崧嵩忪悚淞竦",
  "sou":"搜艘擞嗽叟薮嗖嗾馊溲飕瞍锼螋",
  "su":"诉苏速素酥俗粟僳塑溯宿肃夙谡蔌嗉愫涑簌觫稣",
  "suan":"算酸蒜狻",
  "sui":"岁随虽隋绥髓碎穗遂隧祟谇荽濉邃燧",
  "sun":"孙损笋荪狲飧榫隼",
  "suo":"所索莎蓑梭唆缩琐锁唢嗦嗍娑桫挲睃羧",
  "ta":"他她它塌塔獭挞蹋踏嗒闼溻遢榻沓铊趿鳎",
  "tai":"太台态胎苔抬泰酞汰邰薹骀肽炱钛跆鲐",
  "tan":"谈探坦坍摊贪瘫滩坛檀痰潭谭毯袒碳叹炭郯昙忐钽锬覃",
  "tang":"堂汤塘搪棠膛唐糖倘躺淌趟烫傥帑溏瑭樘铴镗耥螗螳羰醣",
  "tao":"套掏涛滔绦萄桃逃淘陶讨鼗叨啕洮韬饕",
  "te":"特忒忑慝铽",
  "teng":"藤腾疼誊滕",
  "ti":"体提题梯剔踢锑蹄啼替嚏惕涕剃屉倜悌逖绨缇鹈醍",
  "tian":"天添填田甜恬舔腆掭忝阗殄畋",
  "tiao":"条调跳挑迢眺佻苕祧窕蜩笤粜龆鲦髫",
  "tie":"铁贴帖萜餮",
  "ting":"听停庭厅烃汀廷亭挺艇莛葶婷梃町铤蜓霆",
  "tong":"同通统痛童桐酮瞳铜彤桶捅筒佟僮仝茼嗵峒恸潼砼",
  "tou":"头投偷透亠骰",
  "tu":"突图土凸秃徒途涂屠吐兔堍荼菟钍酴",
  "tuan":"团湍抟彖疃",
  "tui":"推退腿颓蜕褪煺",
  "tun":"吞屯臀氽饨暾豚",
  "tuo":"托脱拖鸵陀驮驼椭妥拓唾乇佗坨庹沲沱柝柁橐砣箨酡跎鼍",
  "wa":"挖哇蛙洼娃瓦袜佤娲腽",
  "wai":"外歪呙崴",
  "wan":"万完晚玩豌弯湾顽丸烷碗挽皖惋宛婉腕剜芄菀纨绾琬脘畹蜿箢",
  "wang":"望往王忘亡汪枉网旺妄罔惘辋魍",
  "wei":"为位未维味微围卫委威巍危韦违桅唯惟潍苇萎伟伪尾纬蔚畏胃喂魏渭谓尉慰偎诿隈隗圩葳薇囗帏帷嵬猥猬闱沩洧涠逶娓玮韪軎炜煨痿艉鲔",
  "wen":"问文温闻瘟蚊纹吻稳紊刎阌汶璺雯",
  "weng":"嗡翁瓮蓊蕹",
  "wo":"我蜗涡窝斡卧握沃倭莴幄渥肟硪龌",
  "wu":"无物五务屋舞午武误巫呜钨乌污诬芜梧吾吴毋捂伍侮坞戊雾晤勿悟兀仵阢邬圬芴唔庑怃忤浯寤迕妩婺骛杌牾焐鹉鹜痦蜈鋈鼯",
  "xi":"西喜希系息细习吸戏洗席昔熙析硒矽晰嘻锡牺稀悉膝夕惜熄烯溪汐犀檄袭媳隙僖兮隰郗菥葸蓰奚唏徙饩阋浠淅屣嬉玺樨曦觋欷歙熹禊禧皙穸裼蜥螅蟋舄舾羲粞翕醯鼷",
  "xia":"下夏瞎虾匣霞辖暇峡侠狭吓呷狎遐瑕柙硖罅黠",
  "xian":"现先显线险鲜铣掀锨仙纤咸贤衔舷闲涎弦嫌献县腺馅羡宪陷限冼苋莶藓岘猃暹娴氙燹祆鹇痫蚬筅籼酰跣跹霰",
  "xiang":"想相向像象响香乡项厢镶箱襄湘翔祥详享巷橡芗葙饷庠骧缃蟓鲞飨",
  "xiao":"小笑消校萧硝霄削哮嚣销宵淆晓孝肖啸效哓崤潇逍骁绡枭枵蛸筱箫魈",
  "xie":"些写血谢鞋楔歇蝎协挟携邪斜胁谐械卸蟹懈泄泻屑偕亵勰燮薤撷獬廨渫瀣邂绁缬榭榍躞",
  "xin":"心信新薪芯锌欣辛忻衅囟馨忄昕歆镡鑫",
  "xing":"性星形兴幸型醒腥猩惺刑邢杏姓陉荇荥擤饧悻硎",
  "xiong":"雄兄凶胸匈汹熊芎",
  "xiu":"修休羞朽嗅锈秀袖绣咻岫馐庥溴鸺貅髹",
  "xu":"许需须续墟戌虚嘘徐蓄酗叙旭序畜恤絮婿绪吁诩勖蓿洫溆顼栩煦砉盱胥糈醑",
  "xuan":"选宣轩喧悬旋玄癣眩绚儇谖萱揎泫渲漩璇楦暄炫煊碹铉镟痃",
  "xue":"学雪靴薛穴谑泶踅鳕",
  "xun":"寻勋熏循旬询驯巡殉汛训讯逊迅巽郇埙荀蕈薰峋徇獯恂洵浔曛醺鲟",
  "ya":"亚牙压呀押鸦鸭丫芽蚜崖衙涯雅哑讶轧伢垭揠吖岈迓娅琊桠氩砑睚痖",
  "yan":"眼言演验严研烟焉咽阉淹盐蜒岩延颜阎炎沿奄掩衍艳堰燕厌砚雁唁彦焰宴谚厣赝剡俨偃兖讠谳郾鄢埏菸崦恹闫湮滟妍嫣琰檐晏胭焱罨筵酽魇餍鼹",
  "yang":"样养阳洋殃央鸯秧杨扬佯疡羊氧仰痒漾徉怏泱炀烊恙蛘鞅",
  "yao":"要药摇邀腰妖瑶尧遥窑谣姚咬舀耀夭爻吆崾徭幺珧杳轺曜肴鹞窈繇鳐垚",
  "ye":"也业夜叶野椰噎耶爷冶页掖曳腋液靥谒邺揶晔烨铘",
  "yi":"一以意已医衣义易议艺依异遗伊疑忆壹揖铱颐夷移仪胰沂宜姨彝椅蚁倚乙矣抑邑屹亿役臆逸肄疫亦裔毅益溢诣谊译翼翌绎刈劓仡佚佾诒圯埸懿苡荑薏弈奕挹弋呓咦咿嗌噫峄嶷猗饴怿怡悒漪迤驿缢殪轶贻旖熠眙钇镒镱痍瘗癔翊衤蜴舣羿翳酏黟",
  "yin":"因音引印银茵荫殷阴姻吟淫寅饮尹隐胤鄞廴垠堙茚吲喑狺夤洇氤铟瘾窨蚓霪龈",
  "ying":"应英影营樱婴鹰缨莹萤荧蝇迎赢盈颖硬映嬴郢茔莺萦蓥撄嘤膺滢潆瀛瑛璎楹媵鹦瘿颍罂",
  "yo":"哟唷",
  "yong":"用永拥佣臃痈庸雍踊蛹咏泳涌恿勇俑壅墉喁慵邕镛甬鳙饔",
  "you":"有又由友游右油优幽悠忧尤邮铀犹酉佑釉诱幼卣攸侑莠莜莸尢呦囿宥柚猷牖铕疣蚰蚴蝣鱿黝鼬",
  "yu":"于与语育遇雨鱼余预迂淤盂榆虞愚舆俞逾愉渝渔隅予娱屿禹宇羽玉域芋郁喻峪御愈欲狱誉浴寓裕豫驭禺毓伛俣谀谕萸蓣揄圄圉嵛狳饫馀庾阈鬻妪妤纡瑜昱觎腴欤於煜燠肀聿钰鹆鹬瘐瘀窬窳蜮蝓竽臾舁雩龉",
  "yuan":"员原远元院愿园鸳渊冤垣袁援辕圆猿源缘苑怨垸塬芫掾沅媛瑗橼爰眢鸢螈鼋",
  "yue":"月约越曰跃钥岳粤悦阅龠哕瀹樾刖钺玥",
  "yun":"运云耘郧匀陨允蕴酝晕韵孕郓芸狁恽愠纭韫殒昀氲熨筠",
  "za":"杂匝砸扎咋拶咂",
  "zai":"在再栽哉灾宰载崽甾",
  "zan":"咱攒暂赞瓒昝簪糌趱錾",
  "zang":"赃脏葬奘驵臧",
  "zao":"早造遭糟凿藻枣澡蚤躁噪皂灶燥唣",
  "ze":"则责择泽仄赜啧帻迮昃箦舴",
  "zei":"贼",
  "zen":"怎谮",
  "zeng":"曾增憎赠缯甑罾锃",
  "zha":"喳渣札铡闸眨栅榨乍炸诈揸吒咤哳楂砟痄蚱齄",
  "zhai":"摘斋宅窄债寨砦瘵",
  "zhan":"战站展瞻毡詹沾盏斩辗崭蘸栈占湛绽谵搌旃",
  "zhang":"张丈章樟彰漳掌涨杖帐账仗胀瘴障仉鄣幛嶂獐嫜璋蟑",
  "zhao":"着找照朝招昭沼赵罩兆肇召爪诏棹钊笊",
  "zhe":"这者遮折哲蛰辙锗蔗浙谪摺柘辄磔鹧褶蜇赭",
  "zhen":"真珍阵斟甄砧臻贞针侦枕疹诊震振镇帧圳蓁浈溱缜桢椹榛轸赈胗朕祯畛稹鸩箴",
  "zheng":"正整争证征蒸挣睁狰怔拯政症郑诤峥钲铮筝",
  "zhi":"之只知直至指制志治致纸支止质值职智置芝枝吱蜘肢脂汁织植殖执侄址趾旨挚掷帜峙秩稚炙痔滞窒卮陟郅埴芷摭帙徵夂忮彘咫骘栉枳栀桎轵轾贽胝膣祉祗黹雉鸷痣蛭絷酯跖踬踯豸觯",
  "zhong":"中种重终钟众盅忠衷肿仲冢锺螽舯踵",
  "zhou":"周州洲舟诌粥轴肘帚咒皱宙昼骤荮啁妯纣绉胄碡籀酎",
  "zhu":"主住注助著珠株蛛朱猪诸诛逐竹烛煮拄瞩嘱柱蛀贮铸筑祝驻丶伫侏邾苎茱洙渚潴杼槠橥炷铢疰瘃褚竺箸舳翥躅麈",
  "zhua":"挝抓",
  "zhuai":"拽",
  "zhuan":"转专砖撰赚篆啭馔颛",
  "zhuang":"装状桩庄妆撞壮",
  "zhui":"追椎锥赘坠缀惴骓缒隹",
  "zhun":"准谆肫窀",
  "zhuo":"桌捉拙卓琢茁酌啄灼浊倬诼擢浞涿濯焯禚斫镯",
  "zi":"子自字资兹咨姿滋淄孜紫仔籽滓渍谘茈呲嵫姊孳缁梓辎赀恣眦锱秭耔笫粢趑觜訾龇鲻髭",
  "zong":"总鬃棕踪宗综纵偬腙粽",
  "zou":"走邹奏揍诹陬鄹驺鲰",
  "zu":"足组族祖租卒诅阻俎菹镞",
  "zuan":"钻纂攥缵躜",
  "zui":"最嘴罪醉蕞",
  "zun":"尊遵撙樽鳟",
  "zuo":"作做坐座左昨佐柞阼唑嘬怍胙祚笮酢"
};

/* 补充音节：PY_DATA 里没有、但词库里出现的读法 */
const PY_EXTRA = {
  me: '么麽', n: '嗯', shei: '谁', zhei: '这', cei: '啐', lo: '咯', yo: '哟',
  den: '扽', dia: '嗲', tei: '忒', nou: '耨', eng: '嗯', hm: '噷', hng: '哼'
};
for (const k in PY_EXTRA) { if (!PY_DATA[k]) PY_DATA[k] = PY_EXTRA[k]; }

/* ==================== 九宫格（T9）映射 ==================== */
const T9_KEYS = {
  a: '2', b: '2', c: '2', d: '3', e: '3', f: '3', g: '4', h: '4', i: '4',
  j: '5', k: '5', l: '5', m: '6', n: '6', o: '6', p: '7', q: '7', r: '7', s: '7',
  t: '8', u: '8', v: '8', w: '9', x: '9', y: '9', z: '9'
};

const SYL_SET = new Set();
const SYL_BY_T9 = {};
(function () {
  for (const k in PY_DATA) {
    SYL_SET.add(k);
    let code = '';
    for (let i = 0; i < k.length; i++) code += T9_KEYS[k[i]] || '';
    if (code.length !== k.length) continue; // 含非字母字符的音节不进九键
    if (!SYL_BY_T9[code]) SYL_BY_T9[code] = [];
    SYL_BY_T9[code].push(k);
  }
})();

/* ==================== 词库 ==================== */
/* LEX: 拼音key -> { words:[词...], rank, w }   按词频从高到低，w 为词频权重（越常用越大） */
const LEX = new Map();
const INIT_LEX = new Map();
const LEX_MAXLEN = 14;
(function () {
  if (typeof LEX_RAW === 'string' && LEX_RAW) {
    const parts = LEX_RAW.split(';');
    for (let i = 0; i < parts.length; i++) {
      const p = parts[i];
      const c = p.indexOf(':');
      if (c < 1) continue;
      LEX.set(p.slice(0, c), { words: p.slice(c + 1).split(','), rank: i, w: -3.06 * Math.log(i + 10) / Math.log(18010) });
    }
  }
  if (typeof INIT_RAW === 'string' && INIT_RAW) {
    INIT_RAW.split(';').forEach(function (p) {
      const c = p.indexOf(':');
      if (c < 1) return;
      INIT_LEX.set(p.slice(0, c), p.slice(c + 1).split(','));
    });
  }
})();

/* 单字与分词的权重：单字永远低于任意词，避免整句切成一堆单字 */
/* 单字常用度：字符串里越靠前越常用，换算成与词同一量级的分数 */
const CHAR_RANK_MAP = new Map();
(function () {
  if (typeof CHAR_RANK !== 'string') return;
  for (let i = 0; i < CHAR_RANK.length; i++) CHAR_RANK_MAP.set(CHAR_RANK[i], i);
})();
function charScore(ch) {
  const r = CHAR_RANK_MAP.get(ch);
  if (r === undefined) return -3.0;
  return -(3.06 * Math.log(r + 10) / Math.log(7000));
}
/* 分词时单字再压一点分，保证能成词就成词 */
const CHAR_SCORE = -1.5;
const SEG_PENALTY = -0.25;

/** 统一小写、去掉分隔符 */
function pyNorm(buf) {
  return String(buf || '').toLowerCase().replace(/ü/g, 'v').replace(/[^a-z]/g, '');
}

/** 最长的完整音节前缀 */
function longestSyllable(buf) {
  for (let len = Math.min(6, buf.length); len >= 1; len--) {
    const s = buf.slice(0, len);
    if (SYL_SET.has(s)) return s;
  }
  return '';
}

/** 最长的整词拼音前缀（至少两个音节，即 key 长度 >= 2） */
function longestWordKey(buf) {
  for (let len = Math.min(LEX_MAXLEN, buf.length); len >= 2; len--) {
    const k = buf.slice(0, len);
    if (LEX.has(k)) return k;
  }
  return '';
}

/**
 * 全拼最优切分（类动态规划）：
 * 优先整词、其次单字，返回 { text, score, segs, lastWord }
 */
function bestPath(buf) {
  const n = buf.length;
  if (!n) return null;
  const dp = new Array(n + 1).fill(null);
  dp[0] = { score: 0, text: '', segs: [], lastWord: false };
  for (let i = 0; i < n; i++) {
    const cur = dp[i];
    if (!cur) continue;
    // 整词
    for (let len = Math.min(LEX_MAXLEN, n - i); len >= 2; len--) {
      const e = LEX.get(buf.substr(i, len));
      if (!e) continue;
      const sc = cur.score + e.w + SEG_PENALTY;
      const next = dp[i + len];
      if (!next || sc > next.score) {
        dp[i + len] = {
          score: sc,
          text: cur.text + e.words[0],
          segs: cur.segs.concat([e.words[0]]),
          lastWord: true
        };
      }
    }
    // 单字
    for (let len = Math.min(6, n - i); len >= 1; len--) {
      const s = buf.substr(i, len);
      if (!SYL_SET.has(s)) continue;
      const ch = (PY_DATA[s] || '').charAt(0);
      if (!ch) continue;
      const sc = cur.score + charScore(ch) + CHAR_SCORE + SEG_PENALTY;
      const next = dp[i + len];
      if (!next || sc > next.score) {
        dp[i + len] = {
          score: sc,
          text: cur.text + ch,
          segs: cur.segs.concat([ch]),
          lastWord: false
        };
      }
    }
  }
  return dp[n];
}

/** 拼音切分展示（jin tian），用于键盘上方的提示 */
function pySegDisplay(buf) {
  const out = [];
  let i = 0;
  const n = buf.length;
  while (i < n) {
    let len = Math.min(6, n - i);
    let got = '';
    for (; len >= 1; len--) {
      const s = buf.substr(i, len);
      if (SYL_SET.has(s)) { got = s; break; }
    }
    if (!got) { out.push(buf.slice(i)); break; }  // 还没打完整的尾巴整段显示
    out.push(got);
    i += got.length;
  }
  return out.join(' ');
}

/**
 * 26 键候选
 * 返回 { cands: [{t:上屏文字, rest:剩余拼音}], seg }
 */
function pyAnalyze(raw) {
  const buf = pyNorm(raw);
  const res = { cands: [], seg: '' };
  if (!buf) return res;
  const seen = new Set();
  const push = function (t, rest) {
    t = String(t || '');
    if (!t) return;
    const k = t + '\u0001' + rest;
    if (seen.has(k)) return;
    seen.add(k);
    res.cands.push({ t: t, rest: rest });
  };

  const bp = bestPath(buf);
  res.seg = pySegDisplay(buf);
  // 整句：必须覆盖全部输入、至少两个字、且最后一段是完整词
  if (bp && bp.lastWord && bp.text.length >= 2 && bp.segs.length >= 1) push(bp.text, '');

  // 整词前缀（含剩余拼音，选完继续打剩下的）
  const wk = longestWordKey(buf);
  if (wk) {
    for (const w of LEX.get(wk).words) push(w, buf.slice(wk.length));
  }

  // 单字：最长完整音节
  const sy = longestSyllable(buf);
  if (sy) {
    const chars = (PY_DATA[sy] || '').split('').sort(function (a, b) { return charScore(b) - charScore(a); });
    for (let i = 0; i < chars.length; i++) push(chars[i], buf.slice(sy.length));
  }

  // 简拼（整串就是首字母）
  const inits = INIT_LEX.get(buf);
  if (inits) for (const w of inits) push(w, '');

  res.cands = res.cands.slice(0, 44);
  return res;
}

/** 九键：把数字串切成若干音节（最多 200 条路径） */
function t9Segments(digits) {
  const out = [];
  const cur = [];
  const walk = function (pos) {
    if (out.length >= 200) return;
    if (pos === digits.length) { out.push(cur.slice()); return; }
    for (let len = Math.min(6, digits.length - pos); len >= 1; len--) {
      const list = SYL_BY_T9[digits.substr(pos, len)];
      if (!list) continue;
      for (const s of list) {
        cur.push({ s: s, len: len });
        walk(pos + len);
        cur.pop();
        if (out.length >= 200) return;
      }
    }
  };
  walk(0);
  return out;
}

/**
 * 九键候选：枚举所有可能的音节切分，按「输入先验」排序，
 * 再合并前几条切分的第一段词/字候选。规则参考开源输入法的多路径候选：
 *   - 音节越少越可信；整串正好是一个音节时给强先验
 *   - 一次能吃掉全部数字的候选优先
 *   - 词按词频权重，单字按常用度权重
 */
function t9Analyze(digits) {
  const res = { cands: [], seg: '' };
  digits = String(digits || '').replace(/[^0-9]/g, '');
  if (!digits) return res;
  const segs = t9Segments(digits);
  if (!segs.length) return res;

  const paths = [];
  for (const path of segs) {
    const n = path.length;
    let prior = -0.45 * (n - 1);
    if (n === 1) {
      const same = SYL_BY_T9[digits] || [];
      if (same.indexOf(path[0].s) >= 0) prior += 0.9;
    }
    paths.push({ path: path, n: n, prior: prior });
  }
  paths.sort(function (a, b) { return b.prior - a.prior; });

  const seen = new Map();
  const add = function (t, rest, sc) {
    t = String(t || '');
    if (!t) return;
    const k = t + '\u0001' + rest;
    const old = seen.get(k);
    if (!old || sc > old.sc) seen.set(k, { t: t, rest: rest, sc: sc });
  };
  const restPenalty = function (rest) { return -0.14 * rest.length; };

  const top = paths.slice(0, 8);
  for (const p of top) {
    const code0 = digits.slice(0, p.path[0].len);
    let key = '', off = 0;
    for (const syl of p.path) {
      key += syl.s;
      off += syl.len;
      const e = LEX.get(key);
      if (!e) continue;
      const rest = digits.slice(off);
      for (let j = 0; j < e.words.length; j++) {
        add(e.words[j], rest, p.prior + e.w - 0.12 * j + restPenalty(rest));
      }
    }
    const syls = SYL_BY_T9[code0] || [p.path[0].s];
    for (const s of syls) {
      const chars = PY_DATA[s] || '';
      const rest = digits.slice(code0.length);
      for (let i = 0; i < chars.length; i++) {
        add(chars[i], rest, p.prior + charScore(chars[i]) + restPenalty(rest));
      }
    }
  }
  const list = [...seen.values()].sort(function (a, b) {
    if (a.rest.length !== b.rest.length) return a.rest.length - b.rest.length;
    return b.sc - a.sc;
  });
  res.cands = list.slice(0, 44).map(function (x) { return { t: x.t, rest: x.rest }; });
  res.seg = paths[0].path.map(function (x) { return x.s; }).join(' ');
  return res;
}

/* ---- 兼容旧接口（其它地方可能还在调用） ---- */
function pyCandidates(buf) { return pyAnalyze(buf).cands.map(function (c) { return c.t; }); }
function t9Candidates(digits) { return t9Analyze(digits).cands.map(function (c) { return c.t; }); }

