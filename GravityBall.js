const CONS_xV_FRIC = 25, CONS_yV_FRIC = 25, CONS_xV_AERO_FRIC_RATE = 15, CONS_yV_AERO_FRIC_RATE = 15,
	CONS_xV_MOVE_RATE = 100, CONS_yV_MOVE_RATE = 100, CONS_xV_MOVE_ACTUAL=50, CONS_yV_MOVE_ACTUAL=50,
	CONS_CHANGE_MOVE_MAGNIFICATION = 1, CONS_CHAOS_ATTENUATION = 5,
	CONS_GRAV = 490, CONS_GRAV_FRIC_RATE = 75, CONS_CHAOS_GRAV = 500000;
var fps = 60, scale = 100;
var x = 0,y = 0, xV = 0, yV = 0;
/*the plus-x,y is the distance of window's body to main div's*/
/*the bord-x,y is the ball can run range in main div*/
var PLUS_X = 0, PLUS_Y= 0, BORD_X = 0, BORD_Y = 0;
var last_mode= 0, timer = 0, power = 0, powerFlag = 0, pressDownFlag = 0, refreshLimitCount = 0;
var gravMoveFlag = 0;

const setX = (isX) => x += isX / scale;
const setY = (isY) => y += isY / scale;
const getGravBall = () => [$("#gravBall")[0].offsetLeft-$(".main")[0].offsetLeft+10,$("#gravBall")[0].offsetTop-$(".main")[0].offsetTop+10];
const absPlus = (value,plusValue) => value<0?value-plusValue:value+plusValue;

$(function(){
	resize();
	eventBind();
	x = $('.main')[0].clientWidth/2;
	y = $('.main')[0].clientHeight-10;
	setInterval(report,(1000/60));
	refresh();
});
$(window).resize(resize);

function eventBind(){
	$(".console div").on("click",function(){
		if(!last_mode&&$(".console input[type='radio']:checked").length==0)
			return;
		if(!$(this).hasClass('inactive')){
			$(".console input[name=config]").val([last_mode]);
			changeMode(last_mode);
		}else{
			$(".console input[type='radio']:checked").prop("checked",false);
			$(".console input:not([name=config]").val("0");
			checkChaos();
			changeMode();
		}
		$(".console div").toggleClass("inactive");	
	});
	$(".console input[name='config']").on("click",function(){
		if($(this).val()!=last_mode||($(this).val()==last_mode && !$(".console div").hasClass('inactive'))){
			last_mode = $(this).val();
			$(".console div").addClass("inactive");
			changeMode(last_mode);
		}else{
			$(this).prop("checked",false);
			last_mode = 0;
			if($(".console input[type='radio']:checked").length==0)
				$(".console div").removeClass("inactive");
			changeMode();
		}
	});
	$(".console input:not([name=config]").on("click",function(){
		if($(this).val()=="0" || !$(this).is(':checked')){
			$(this).val("1");
			$(".console div").addClass("inactive");
		}else{
			$(this).val("0");
			$(this).prop("checked",false);
			if($(".console input[type='radio']:checked").length==0)
				$(".console div").removeClass("inactive");
		}
		checkChaos();
	});
	$("#gravBall").mousedown(function(e){
		$("#gravBall").css({
    		position: 'fixed'
		});
		gravMoveFlag = 1;
	});
}

function resize(){
	// the main window size
	let _tempSize = Math.min(window.innerWidth,window.innerHeight)-60;
	_tempSize = _tempSize-_tempSize%50;
	scale = _tempSize/10;
	let _tempOtherHeight = (window.innerHeight-_tempSize)/2-10;
	let _tempOtherWidth = (window.innerWidth-_tempSize)/2-5;
	$("div.main").css({
		width : _tempSize+20,
		height : _tempSize+20,
	    'margin-top': _tempOtherHeight,
	    'margin-right': _tempOtherWidth,
	    'margin-bottom': _tempOtherHeight,
	    'margin-left': _tempOtherWidth
	});

	// the report window size
	let _tempLogWidth = _tempOtherWidth>=200?200:0;
	let _tempLogHeight = _tempSize>=350?250:0;
	$("div.main div.report").css({
	    width: _tempLogWidth-6,
		height: _tempLogHeight-6,
		left : _tempOtherWidth-_tempLogWidth+5,
		top : _tempOtherHeight+50
	});
	if (_tempLogWidth&&_tempLogHeight){
		$("div.main div.report").css({
			display:'inline'
		});
	}else{
		$("div.main div.report").css({
			display:'none'
		});
	}

	// the console window size
	let _tempConsoleWidth = _tempOtherWidth>=200?200:0;
	let _tempConsoleHeight = _tempSize-350>=110?110:0;
	$("div.main div.console").css({
	    width: _tempConsoleWidth-6,
		height: _tempConsoleHeight-6,
		left : _tempOtherWidth-_tempConsoleWidth+5,
		top : _tempOtherHeight+50+_tempLogHeight
	});
	if (_tempConsoleWidth&&_tempConsoleHeight){
		$("div.main div.console").css({
			display:'inline'
		});
	}else{
		$("div.main div.console").css({
			display:'none'
		});
	}

	// the power bar size
	let _tempPowerWidth = _tempOtherWidth>=_tempSize*0.025+30?_tempSize*0.025:0;
	$("div.main div.power-bar").css({
	    width: _tempPowerWidth+14,
		height: _tempSize/2+100,
		left : _tempOtherWidth+_tempSize+20+5,
		top : _tempSize/2-100
	});
	if (_tempPowerWidth){
		$("div.main div.power-bar").css({
			display:'inline'
		});
	}else{
		$("div.main div.power-bar").css({
			display:'none'
		});
	}

	// the new div of chaos only size
	let _tempChaosConsoleWidth = _tempOtherWidth>=200?150:0;
	let _tempChaosConsoleHeight = _tempSize-460>=100?100:0;
	$("div.main div.chaos-console").css({
	    width: _tempChaosConsoleWidth-6,
		height: _tempChaosConsoleHeight-6,
		left : _tempOtherWidth-_tempChaosConsoleWidth-45,
		top : _tempOtherHeight+50+_tempLogHeight+_tempConsoleHeight
	});

	PLUS_X = (window.innerWidth-$('.main')[0].clientWidth)/2+10;
	PLUS_Y = (window.innerHeight-$('.main')[0].clientHeight)/2+10;
	BORD_X = $('.main')[0].clientWidth-10;
	BORD_Y = $('.main')[0].clientHeight-10;
	let str0 = "~Report Board~";
	let str4 = "W.Size: ["+$('.main')[0].clientWidth+","+$('.main')[0].clientHeight+"]";
	$("div.main div.report h4").text(str0);
	$("div.main div.report p:eq(3)").text(str4);
}

function refresh(){
	// process the main logic
	process();

	// check range
	x = x>=BORD_X?BORD_X:x<10?10:x;
	y = y>=BORD_Y?BORD_Y:y<10?10:y;
	// move ball
	$('#ball').css({
		left:x-10,
		top:y-10
	});
	setTimeout(refresh,1000/fps);
}

function process(){
	// the Range Check
	if((yV>0 && y==BORD_Y)||(yV<0 && y==10)){
		yV=0;
	}
	if((xV>0 && x==BORD_X)||(xV<0 && x==10)){
		xV=0;
	}
	// process the velocity
	setX(xV);
	setY(yV);

	// if chaos break to processChaos
	if($("#chaos:checked").length)
		return processChaos();

	// If not at the bottom calculate gravity
	if(y!=BORD_Y){
		yV+=CONS_GRAV/fps;
		if($("#superGrav").val()=="1")yV+=CONS_GRAV*4/fps;
	}
	// calculate friction
	if(xV!=0&&y==BORD_Y)xV *= 1-CONS_GRAV_FRIC_RATE/fps/100;
	xV *= 1-CONS_xV_AERO_FRIC_RATE/fps/100;
	yV *= 1-CONS_yV_AERO_FRIC_RATE/fps/100;
	xV = Math.abs(xV)>CONS_xV_FRIC/fps?xV>0?xV-CONS_xV_FRIC/fps:xV+CONS_xV_FRIC/fps:0;
	yV = Math.abs(yV)>CONS_yV_FRIC/fps?yV>0?yV-CONS_yV_FRIC/fps:yV+CONS_yV_FRIC/fps:0;
}

function report(){
	let str1 = "Ball: ["+Math.round(x)+","+Math.round(y)+"]";
	let str2 = "H.Speed："+Math.abs(Math.round(xV));
	let str3 = "V.Speed："+Math.abs(Math.round(yV));
	let str5 = "W.Speed："+fps+"fps";
	$("div.main div.report p:eq(0)").text(str1);
	$("div.main div.report p:eq(1)").text(str2);
	$("div.main div.report p:eq(2)").text(str3);
	$("div.main div.report p:eq(4)").text(str5);
}

function checkChaos(){
	if($("#chaos:checked").length){
		$("div.main,div.main div.chaos-console").addClass("open-chaos");
	}else{
		$("#gravBall").css({
			top: '',
    		left: '',
    		position: ''
		});
		$("div.main,div.main div.chaos-console").removeClass("open-chaos");
	}
}

function processChaos(){
	let gravForm = getGravBall();
	if(gravForm[0]<0 ||gravForm[1]<0) return;
	let xy = Math.pow(gravForm[0]-x,2)+Math.pow(gravForm[1]-y,2)
	let _v = CONS_CHAOS_GRAV/xy;
	let _xy = Math.sqrt(xy);

	let _xV = _v/_xy*Math.abs(gravForm[0]-x);
	let _yV = _v/_xy*Math.abs(gravForm[1]-y);
	xV = gravForm[0]-x>0?xV+_xV:xV-_xV;
	yV = gravForm[1]-y>0?yV+_yV:yV-_yV;
}

function changeMode(mode){
	fps = 60;
	switch(mode){
		case '1':
			fps = 360;
			break;
		case '2':
			fps = 10;
			break;
		default:
			break;
	}
}
var refreshPower = function(){
	if(!powerFlag)return;
	if(refreshLimitCount>=50){
		$("div.main div.power-bar div").text(power+"%");
		$("div.main div.power-bar div").css({
			height: power+"%",
			top: 100-power+"%"
		});
		if(power==100)return;
		power++;
	}else{
		refreshLimitCount++;
	}
	setTimeout(refreshPower,20);
};
$(window).on("mousemove touchmove",function(e){
	if(gravMoveFlag){
		$("#gravBall").css({
    		top: e.clientY-20+'px',
			left: e.clientX-20+'px'
		});
	}
});
$(window).on("mousedown touchstart",function(e){
	timer = 0;
	if(e.target!=$("div.main")[0] || $("#onePress:checked").length && !(xV == 0 && yV == 0)) return;
	pressDownFlag = 1;
	timer = e.timeStamp;
	powerFlag=1;
	power=0;
	$("div.main div.power-bar div").text(power+"%");
	$("div.main div.power-bar div").css({
		height: 0+"%",
		top: 100+"%"
	});
	refreshLimitCount = 0;
	if(!$("#noCharge:checked").length)
		refreshPower();
});
$(window).on("mouseup touchend",function(e){
	gravMoveFlag = 0;
	powerFlag=0;
	if(!pressDownFlag) return;
	pressDownFlag = 0;
	if(e.target!=$("div.main")[0] || $("#onePress:checked").length && !(xV == 0 && yV == 0)) return;
	let changeRate = (timer && !$("#noCharge:checked").length && e.timeStamp-timer>1000)?1+(e.timeStamp-timer-1000)/(1000*CONS_CHANGE_MOVE_MAGNIFICATION):1;
	changeRate = changeRate>3?3:changeRate;
	changeRate = $("#chaos:checked").length?changeRate/CONS_CHAOS_ATTENUATION:changeRate;
	moveBall(e.clientX-PLUS_X,e.clientY-PLUS_Y,changeRate);
});
function moveBall(xAs,yAs,changeRate){
	xV+=absPlus(CONS_xV_MOVE_RATE*(xAs-x),CONS_xV_MOVE_ACTUAL)/scale*changeRate;
	yV+=absPlus(CONS_yV_MOVE_RATE*(yAs-y),CONS_yV_MOVE_ACTUAL)/scale*changeRate;
}