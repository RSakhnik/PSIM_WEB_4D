/* eslint-disable @typescript-eslint/no-unused-vars */
import lockImg from '../assets/lock.png';
   export class Timeline{
        private w: number;
        private h: number;
        private start: Date;
        private end: Date; 
        private canvas: HTMLCanvasElement;
        private absoluteStart: Date;
        private absoluteEnd: Date;
        private ctx: CanvasRenderingContext2D;
        private timelineHeight: number;
        private W: number = 0;
        private H: number = 0;
        private monthes_length: number[] = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
        private monthes_names: string[] = ["Янв", "Фев", "Март", "Апр", "Май", "Июнь", "Июль", "Авг", "Сен", "Окт", "Ноя", "Дек"];
        private days_names: string[] = ["Вс", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб"];
        private scale: number = 1;
        private min_scale: number=1;
        private max_scale: number=1;
        private cursorMoving: boolean = false;
        private isDragging: boolean=false;
        private zooming: boolean=false;
        private scale_decreasing: boolean=false;
        private slider_x: number = 0;
        private prev_x: number=0;
        private scale_lock: boolean=false;
        private last_check_time: number =Date.now();
        private choosenDate: Date| null = null;
        private mouseX: number = 0;
        private mouseY: number = 0;
        private lock_image: HTMLImageElement = new Image();
        private lockImageReady: boolean = false;
        private changeListeners: ((date: Date) => void)[] = [];
        private lastEmittedDate: number | null = null;
        private isHovered = false;
        constructor(
                start: Date,
                end: Date, 
                canvas: HTMLCanvasElement,){
            this.w= canvas.width;
            this.h=canvas.height;
            this.canvas=canvas;
            this.start=new Date(start);
            this.end=new Date(end);
            this.absoluteStart=new Date(start);
            this.absoluteEnd=new Date(end);
            this.ctx=canvas.getContext('2d')!;
            this.timelineHeight=Math.min(this.h*0.99, 102);
            this.lock_image.onload = () => {
    this.lockImageReady = true;
    console.log("lock image ready");
};

this.lock_image.onerror = () => {
    console.error("image failed");
};

this.lock_image.src =lockImg;
            if (!this.ctx) {
            console.error('Не удалось получить контекст canvas!');
            
            
            
            return;
        }
            this.W=canvas.width;
            this.H=canvas.height;
            
            this.scale=1;
            this.min_scale = (this.W - 50) / (this.end.getTime() - this.start.getTime());
this.max_scale = (this.W - 50) / (1000 * 60 * 60 * 24 * 8);
            //this.setupMouseEvents();
            this.cursorMoving=false;
            this.isDragging=false;
            this.zooming=false;
            this.scale_decreasing=false;

            this.initMouseEvents();
            this.init_keyboard_events();
            this.slider_x = (this.W - 50) / 2;  
this.choosenDate = this.getallDateFromX(this.slider_x);
            this.initDragging();

            this.prev_x=this.mouseX;
            this.scale_lock=false;
            this.last_check_time=Date.now();
            this.lockImageReady=false;
            /*try{
                this.lock_image.src='lock.png';
            } catch(error){
                console.warn('png not found')
            }*/
            
        }
        private checkDateChange() {
            if (!this.choosenDate) return;

            const time = this.choosenDate.getTime();

            if (this.lastEmittedDate === time) return;

            this.lastEmittedDate = time;
            this.emitChange(this.choosenDate);
    }
        TimeToX() {
    this.scale = (this.W - 50) / (this.end.getTime() - this.start.getTime());
}
 drawTimeline() {
    const yearFontSize = this.scale * 1000 * 60 * 60 * 24 * 365 * 0.3;
    const monthFontSize = this.scale * 1000 * 60 * 60 * 24 * 30 * 0.4;
    const weekFontSize = this.scale * 1000 * 60 * 60 * 24 * 7 * 0.5;
    const dayFontSize = this.scale * 1000 * 60 * 60 * 24 * 1 * 0.6;

    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    this.ctx.strokeStyle = '#999999';
    this.ctx.lineWidth = 1;

    this.TimeToX();

    const start_time = this.start.getTime();
    const anchor_time = this.choosenDate?.getTime() ?? Date.now();
    const yearDate = new Date(anchor_time);

    yearDate.setMonth(0, 1);
    yearDate.setHours(0, 0, 0, 0);
    const yearDateLeft = new Date(yearDate);
    yearDateLeft.setFullYear(yearDateLeft.getFullYear() - 1);
    yearDateLeft.setMonth(0, 1);
    yearDateLeft.setHours(0, 0, 0, 0);

    while (yearDate.getTime() < this.end.getTime() + 1000 * 60 * 60 * 24 * 365) {
        let k;
        if (yearDate.getFullYear() % 4 == 0) k = 366;
        else k = 365;
        const x = (yearDate.getTime() - start_time) * this.scale;  // убрали +50
        this.ctx.beginPath();
        this.ctx.moveTo(x, 0);
        this.ctx.lineTo(x, this.timelineHeight / 3);
        this.ctx.stroke();

        const baseColor = yearDate.getFullYear() % 2 == 0 ? '#d4d4d4' : '#c0c0c0';
        const g = this.ctx.createLinearGradient(0, 0, 0, this.timelineHeight / 3);
        g.addColorStop(0, baseColor);
        g.addColorStop(0.7, baseColor);
        g.addColorStop(1, 'rgba(255, 255, 255, 0.3)');
        this.ctx.fillStyle = g;
        this.ctx.fillRect(x, 0, this.scale * 1000 * 60 * 60 * 24 * k, this.timelineHeight / 3);
        this.ctx.globalAlpha = 0.2;
        this.ctx.fillStyle = baseColor;
        this.ctx.fillRect(x, 0, this.scale * 1000 * 60 * 60 * 24 * k, this.timelineHeight / 3);
        this.ctx.globalAlpha = 1.0;

        this.ctx.fillStyle = '#3a3a3a';
        this.ctx.font = `${Math.min(yearFontSize, 18)}px "Segoe UI", Arial, sans-serif`;
        const center = (Math.max(x, 0) + Math.min(x + this.scale * 1000 * 60 * 60 * 24 * k, this.W - 50)) / 2;
        if (center < 0 || center > this.W - 50) {
            yearDate.setFullYear(yearDate.getFullYear() + 1);
            continue;
        }
        this.ctx.fillText(yearDate.getFullYear().toString(), center, this.timelineHeight / 6);
        yearDate.setFullYear(yearDate.getFullYear() + 1);
    }

    while (yearDateLeft.getTime() > this.start.getTime() - 1000 * 60 * 60 * 24 * 365) {
        let k;
        if (yearDateLeft.getFullYear() % 4 == 0) k = 366;
        else k = 365;
        const x = (yearDateLeft.getTime() - start_time) * this.scale;
        this.ctx.beginPath();
        this.ctx.moveTo(x, 0);
        this.ctx.lineTo(x, this.timelineHeight / 3);
        this.ctx.stroke();

        const center = (Math.max(x, 0) + Math.min(x + this.scale * 1000 * 60 * 60 * 24 * k, this.W - 50)) / 2;
        const baseColor = yearDateLeft.getFullYear() % 2 == 0 ? '#d4d4d4' : '#c0c0c0';
        const g = this.ctx.createLinearGradient(0, 0, 0, this.timelineHeight / 3);
        g.addColorStop(0, baseColor);
        g.addColorStop(0.7, baseColor);
        g.addColorStop(1, 'rgba(255, 255, 255, 0.3)');
        this.ctx.fillStyle = g;
        this.ctx.fillRect(x, 0, this.scale * 1000 * 60 * 60 * 24 * k, this.timelineHeight / 3);
        this.ctx.globalAlpha = 0.2;
        this.ctx.fillStyle = baseColor;
        this.ctx.fillRect(x, 0, this.scale * 1000 * 60 * 60 * 24 * k, this.timelineHeight / 3);
        this.ctx.globalAlpha = 1.0;

        this.ctx.fillStyle = '#3a3a3a';
        this.ctx.font = `${Math.min(yearFontSize, 18)}px "Segoe UI", Arial, sans-serif`;
        if (center < 0 || center > this.W - 50) {
            yearDateLeft.setFullYear(yearDateLeft.getFullYear() - 1);
            continue;
        }
        this.ctx.fillText(yearDateLeft.getFullYear().toString(), center, this.timelineHeight / 6);
        yearDateLeft.setFullYear(yearDateLeft.getFullYear() - 1);
    }

    this.ctx.font = `${Math.min(monthFontSize, 16)}px "Segoe UI", Arial, sans-serif`;
    const monthDate = new Date(anchor_time);
    monthDate.setDate(1);
    monthDate.setHours(0, 0, 0, 0);
    const monthDateLeft = new Date(monthDate);
    monthDateLeft.setMonth(monthDateLeft.getMonth() - 1);
    const monthes_drawn = new Set();

    while (monthDate.getTime() < this.end.getTime() + 1000 * 60 * 60 * 24 * 31) {
        monthes_drawn.add(monthDate.getTime());
        const x = (monthDate.getTime() - start_time) * this.scale;
        this.ctx.beginPath();
        this.ctx.moveTo(x, this.timelineHeight / 3);
        this.ctx.lineTo(x, 2 * this.timelineHeight / 3);
        this.ctx.stroke();

        if (monthDate.getMonth() == 1 && (monthDate.getFullYear() % 4 == 0)) this.monthes_length[1] = 29;
        else this.monthes_length[1] = 28;

        const baseColor = monthDate.getMonth() % 2 === 0 ? '#e0e0e0' : '#d0d0d0';
        const g = this.ctx.createLinearGradient(0, this.timelineHeight / 3, 0, this.timelineHeight / 3 * 2);
        g.addColorStop(0, baseColor);
        g.addColorStop(0.6, baseColor);
        g.addColorStop(1, 'rgba(255, 255, 255, 0.25)');
        this.ctx.fillStyle = g;
        const center = (Math.max(x, 0) + Math.min(x + this.scale * 1000 * 60 * 60 * 24 * this.monthes_length[monthDate.getMonth()], this.W - 50)) / 2;
        this.ctx.fillRect(x, this.timelineHeight / 3, this.scale * 1000 * 60 * 60 * 24 * this.monthes_length[monthDate.getMonth()], this.timelineHeight / 3);

        this.ctx.fillStyle = '#3a3a3a';
        this.ctx.fillText(this.monthes_names[monthDate.getMonth()], center, this.timelineHeight / 2);

        monthDate.setMonth(monthDate.getMonth() + 1);
    }

    while (monthDateLeft.getTime() > this.start.getTime() - 1000 * 60 * 60 * 24 * 31) {
        if (monthes_drawn.has(monthDateLeft.getTime())) {
            monthDateLeft.setMonth(monthDateLeft.getMonth() - 1);
            continue;
        }
        const x = (monthDateLeft.getTime() - start_time) * this.scale;
        this.ctx.beginPath();
        this.ctx.moveTo(x, this.timelineHeight / 3);
        this.ctx.lineTo(x, this.timelineHeight / 3 * 2);
        this.ctx.stroke();

        if (monthDateLeft.getMonth() == 1 && (monthDateLeft.getFullYear() % 4 == 0)) this.monthes_length[1] = 29;
        else this.monthes_length[1] = 28;

        const baseColor = monthDateLeft.getMonth() % 2 === 0 ? '#e0e0e0' : '#d0d0d0';
        const g = this.ctx.createLinearGradient(0, this.timelineHeight / 3, 0, this.timelineHeight / 3 * 2);
        g.addColorStop(0, baseColor);
        g.addColorStop(0.6, baseColor);
        g.addColorStop(1, 'rgba(255, 255, 255, 0.25)');
        this.ctx.fillStyle = g;
        const center = (Math.max(x, 0) + Math.min(x + this.scale * 1000 * 60 * 60 * 24 * this.monthes_length[monthDateLeft.getMonth()], this.W - 50)) / 2;
        this.ctx.fillRect(x, this.timelineHeight / 3, this.scale * 1000 * 60 * 60 * 24 * this.monthes_length[monthDateLeft.getMonth()], this.timelineHeight / 3);

        this.ctx.fillStyle = '#3a3a3a';
        this.ctx.fillText(this.monthes_names[monthDateLeft.getMonth()], center, this.timelineHeight / 2);
        monthDateLeft.setMonth(monthDateLeft.getMonth() - 1);
    }

    const mondayDate = new Date(anchor_time);
    mondayDate.setHours(0, 0, 0, 0);
    const mondayDateLeft = new Date(mondayDate);
    while (mondayDate.getDay() != 1) mondayDate.setDate(mondayDate.getDate() - 1);
    while (mondayDateLeft.getDay() != 1) mondayDateLeft.setDate(mondayDateLeft.getDate() - 1);
    let x;
    const week_ms = 7 * 1000 * 60 * 60 * 24;

    while (mondayDate.getTime() < this.end.getTime() + 1000 * 60 * 60 * 24 * 7) {
        if (this.scale > 50 / (1000 * 60 * 60 * 24)) {
            const day = new Date(mondayDate);
            while (day.getTime() < mondayDate.getTime() + 7 * 1000 * 60 * 60 * 24) {
                this.ctx.font = `${Math.min(dayFontSize, 13)}px "Segoe UI", Arial, sans-serif`;
                x = (day.getTime() - start_time) * this.scale;
                this.ctx.beginPath();
                this.ctx.moveTo(x, this.timelineHeight / 3 * 2);
                this.ctx.lineTo(x, this.timelineHeight);
                this.ctx.stroke();

                const baseColor = (day.getDay() == 0 || day.getDay() == 6) ? '#b0b0b0' : (day.getDay() % 2 == 0 ? '#e8e8e8' : '#dddddd');
                const Color = (day.getDay() == 0 || day.getDay() == 6) ? '#f0f0f0' : (day.getDay() % 2 == 0 ? '#ffffff' : '#f8f8f8');
                const g = this.ctx.createLinearGradient(0, this.timelineHeight / 3 * 2, 0, this.timelineHeight);
                g.addColorStop(0, baseColor);
                g.addColorStop(1, Color);
                this.ctx.fillStyle = g;

                if (this.choosenDate && day.getDate() == this.choosenDate.getDate() && day.getMonth() == this.choosenDate.getMonth() && day.getFullYear() == this.choosenDate.getFullYear()) {
                    this.ctx.fillStyle = '#de1111';
                    this.ctx.fillRect(x, this.timelineHeight / 3 * 2, this.scale * 1000 * 60 * 60 * 24, this.timelineHeight / 3);
                    this.ctx.fillStyle = g;
                    this.ctx.fillRect(x + 2, this.timelineHeight / 3 * 2 + 2, this.scale * 1000 * 60 * 60 * 24 - 4, this.timelineHeight / 3 - 4);
                    this.ctx.fillStyle = '#5e2a2a';
                    this.ctx.font = `${Math.min(dayFontSize, 13)}px "Segoe UI", Arial, sans-serif`;
                } else {
                    this.ctx.fillRect(x, this.timelineHeight / 3 * 2, this.scale * 1000 * 60 * 60 * 24, this.timelineHeight / 3);
                    this.ctx.fillStyle = '#3a3a3a';
                    this.ctx.font = `${Math.min(dayFontSize, 13)}px "Segoe UI", Arial, sans-serif`;
                }

                this.ctx.fillText(day.getDate().toString(), x + this.scale * 0.25 * 1000 * 60 * 60 * 24, this.timelineHeight / 3 * 2 + 5);
                this.ctx.fillText(this.days_names[day.getDay()], x + this.scale * 0.75 * 1000 * 60 * 60 * 24, this.timelineHeight / 3 * 2 + 9);
                day.setDate(day.getDate() + 1);
            }
        } else {
            x = (mondayDate.getTime() - start_time) * this.scale;
            this.ctx.beginPath();
            this.ctx.moveTo(x, this.timelineHeight / 3 * 2);
            this.ctx.lineTo(x, this.timelineHeight);
            this.ctx.stroke();

            const weekKey = Math.floor(mondayDate.getTime() / week_ms);
            const baseColor = weekKey % 2 == 0 ? '#c8c8c8' : '#b8b8b8';
            const Color = weekKey % 2 == 0 ? '#efefef' : '#e5e5e5';
            const g = this.ctx.createLinearGradient(0, this.timelineHeight / 3 * 2, 0, this.timelineHeight);
            g.addColorStop(0, baseColor);
            g.addColorStop(1, Color);
            this.ctx.fillStyle = g;

            const weekStart = mondayDate.getTime();
            const weekEnd = weekStart + week_ms;
            const isSelectedInWeek = this.choosenDate && 
                this.choosenDate.getTime() >= weekStart && 
                this.choosenDate.getTime() < weekEnd;

            if (isSelectedInWeek) {
                this.ctx.fillStyle = '#de1111';
                this.ctx.fillRect(x, this.timelineHeight / 3 * 2, this.scale * 1000 * 60 * 60 * 24 * 7, this.timelineHeight / 3);
                this.ctx.fillStyle = g;
                this.ctx.fillRect(x + 2, this.timelineHeight / 3 * 2 + 2, this.scale * 1000 * 60 * 60 * 24 * 7 - 4, this.timelineHeight / 3 - 4);
                this.ctx.fillStyle = '#5e2a2a';
                this.ctx.font = `${Math.min(weekFontSize, 14)}px "Segoe UI", Arial, sans-serif`;
            } else {
                this.ctx.fillRect(x, this.timelineHeight / 3 * 2, this.scale * 1000 * 60 * 60 * 24 * 7, this.timelineHeight / 3);
                this.ctx.fillStyle = '#3a3a3a';
                this.ctx.font = `${Math.min(weekFontSize, 14)}px "Segoe UI", Arial, sans-serif`;
            }
            this.ctx.fillText(mondayDate.getDate().toString(), x + this.scale * 1 * 1000 * 60 * 60 * 24 + 3, this.timelineHeight / 3 * 2 + this.timelineHeight / 6);
        }
        mondayDate.setDate(mondayDate.getDate() + 7);
    }

    while (mondayDateLeft.getTime() > this.start.getTime() - 1000 * 60 * 60 * 24 * 7) {
        if (this.scale > 50 / (1000 * 60 * 60 * 24)) {
            const day = new Date(mondayDateLeft);
            while (day.getTime() > mondayDateLeft.getTime() - 7 * 1000 * 60 * 60 * 24) {
                this.ctx.font = `${Math.min(dayFontSize, 13)}px "Segoe UI", Arial, sans-serif`;
                x = (day.getTime() - start_time) * this.scale;
                this.ctx.beginPath();
                this.ctx.moveTo(x, this.timelineHeight / 3 * 2);
                this.ctx.lineTo(x, this.timelineHeight);
                this.ctx.stroke();

                const baseColor = (day.getDay() == 0 || day.getDay() == 6) ? '#b0b0b0' : (day.getDay() % 2 == 0 ? '#e8e8e8' : '#dddddd');
                const Color = (day.getDay() == 0 || day.getDay() == 6) ? '#f0f0f0' : (day.getDay() % 2 == 0 ? '#ffffff' : '#f8f8f8');
                const g = this.ctx.createLinearGradient(0, this.timelineHeight / 3 * 2, 0, this.timelineHeight);
                g.addColorStop(0, baseColor);
                g.addColorStop(1, Color);
                this.ctx.fillStyle = g;

                if (this.choosenDate && day.getDate() == this.choosenDate.getDate() && day.getMonth() == this.choosenDate.getMonth() && day.getFullYear() == this.choosenDate.getFullYear()) {
                    this.ctx.fillStyle = '#de1111';
                    this.ctx.fillRect(x, this.timelineHeight / 3 * 2, this.scale * 1000 * 60 * 60 * 24, this.timelineHeight / 3);
                    this.ctx.fillStyle = g;
                    this.ctx.fillRect(x + 2, this.timelineHeight / 3 * 2 + 2, this.scale * 1000 * 60 * 60 * 24 - 4, this.timelineHeight / 3 - 4);
                    this.ctx.fillStyle = '#5e2a2a';
                    this.ctx.font = `${Math.min(dayFontSize, 13)}px "Segoe UI", Arial, sans-serif`;
                } else {
                    this.ctx.fillRect(x, this.timelineHeight / 3 * 2, this.scale * 1000 * 60 * 60 * 24, this.timelineHeight / 3);
                    this.ctx.fillStyle = '#3a3a3a';
                    this.ctx.font = `${Math.min(dayFontSize, 13)}px "Segoe UI", Arial, sans-serif`;
                }

                this.ctx.fillText(day.getDate().toString(), x + this.scale * 0.25 * 1000 * 60 * 60 * 24, this.timelineHeight / 3 * 2 + 5);
                this.ctx.fillText(this.days_names[day.getDay()], x + this.scale * 0.75 * 1000 * 60 * 60 * 24, this.timelineHeight / 3 * 2 + 9);
                day.setDate(day.getDate() - 1);
            }
        } else {
            x = (mondayDateLeft.getTime() - start_time) * this.scale;
            this.ctx.beginPath();
            this.ctx.moveTo(x, this.timelineHeight / 3 * 2);
            this.ctx.lineTo(x, this.timelineHeight);
            this.ctx.stroke();

            const weekKey = Math.floor(mondayDateLeft.getTime() / week_ms);
            const baseColor = weekKey % 2 == 0 ? '#c8c8c8' : '#b8b8b8';
            const Color = weekKey % 2 == 0 ? '#efefef' : '#e5e5e5';
            const g = this.ctx.createLinearGradient(0, this.timelineHeight / 3 * 2, 0, this.timelineHeight);
            g.addColorStop(0, baseColor);
            g.addColorStop(1, Color);
            this.ctx.fillStyle = g;

            const weekStart = mondayDateLeft.getTime();
            const weekEnd = weekStart + week_ms;
            const isSelectedInWeek = this.choosenDate && 
                this.choosenDate.getTime() >= weekStart && 
                this.choosenDate.getTime() < weekEnd;

            if (isSelectedInWeek) {
                this.ctx.fillStyle = '#de1111';
                this.ctx.fillRect(x, this.timelineHeight / 3 * 2, this.scale * 1000 * 60 * 60 * 24 * 7, this.timelineHeight / 3);
                this.ctx.fillStyle = g;
                this.ctx.fillRect(x + 2, this.timelineHeight / 3 * 2 + 2, this.scale * 1000 * 60 * 60 * 24 * 7 - 4, this.timelineHeight / 3 - 4);
                this.ctx.fillStyle = '#5e2a2a';
                this.ctx.font = `${Math.min(weekFontSize, 14)}px "Segoe UI", Arial, sans-serif`;
            } else {
                this.ctx.fillRect(x, this.timelineHeight / 3 * 2, this.scale * 1000 * 60 * 60 * 24 * 7, this.timelineHeight / 3);
                this.ctx.fillStyle = '#3a3a3a';
                this.ctx.font = `${Math.min(weekFontSize, 14)}px "Segoe UI", Arial, sans-serif`;
            }
            this.ctx.fillText(mondayDateLeft.getDate().toString(), x + this.scale * 1 * 1000 * 60 * 60 * 24 + 3, this.timelineHeight / 3 * 2 + this.timelineHeight / 6);
        }
        mondayDateLeft.setDate(mondayDateLeft.getDate() - 7);
    }

    this.ctx.beginPath();
    this.ctx.lineWidth = 1.5;
    this.ctx.strokeStyle = '#999999';
    this.ctx.moveTo(0, 0);
    this.ctx.lineTo(this.W - 50, 0);
    this.ctx.lineTo(this.W - 50, this.timelineHeight);
    this.ctx.lineTo(0, this.timelineHeight);
    this.ctx.lineTo(0, 0);
    this.ctx.moveTo(0, this.timelineHeight / 3);
    this.ctx.lineTo(this.W - 50, this.timelineHeight / 3);
    this.ctx.moveTo(0, this.timelineHeight / 3 * 2);
    this.ctx.lineTo(this.W - 50, this.timelineHeight / 3 * 2);
    this.ctx.stroke();
}
        initMouseEvents(){
            this.mouseX=0;
            this.mouseY=0;
            
            this.canvas.addEventListener('mousemove', (e: MouseEvent)=>{
                
                const rect=this.canvas.getBoundingClientRect();
                this.mouseX=e.clientX-rect.left;
                this.mouseY=e.clientY-rect.top;
                //console.log(`Мышь: X=${this.mouseX}, Y=${this.mouseY}`);
                //this.getDateFromX();
                if (this.isDragging) {
    this.slider_x = this.mouseX;
    this.choosenDate = this.getDateFromX();
    if (this.slider_x < 0) this.slider_x = 0;          
    if (this.slider_x > this.W - 50) this.slider_x = this.W - 50;
}
            });
        }
        checkForMoving(){
            const now=Date.now();
            if (now-this.last_check_time<50) return;
            if(this.prev_x ==this.mouseX){
                this.cursorMoving=false;
            }
            else{
                this.cursorMoving=true;
            }
            this.prev_x=this.mouseX;
            //console.log(`Mouse is moving: ${this.cursorMoving}`);
            this.last_check_time=now;
        }
        getDateFromX(): Date {
    const time = this.slider_x / this.scale;  
    const date = new Date(time + this.start.getTime());
    return date;
}

timeToX(x: number): number {
    return (x - this.start.getTime()) * this.scale; 
}

getallDateFromX(x: number): Date {
    const time = x / this.scale;  
    const date = new Date(time + this.start.getTime());
    return date;
}
        drawSlider(){
            this.ctx.strokeStyle='#801300';
            this.ctx.lineWidth=4;
            this.ctx.beginPath();
            this.ctx.moveTo(this.slider_x, 0);
            this.ctx.lineTo(this.slider_x, this.timelineHeight);
            this.ctx.stroke();
            this.ctx.beginPath();
            this.ctx.roundRect(this.slider_x-7, 0, 14, this.timelineHeight/4, 5);
            this.ctx.fillStyle='#fe3838';
            this.ctx.fill();
            this.ctx.stroke();
            this.ctx.strokeStyle='#801300';
            this.ctx.lineWidth=2;
            this.ctx.beginPath();
            this.ctx.moveTo(this.slider_x-7, this.timelineHeight/16);
            this.ctx.lineTo(this.slider_x+7, this.timelineHeight/16);
            this.ctx.moveTo(this.slider_x-7, this.timelineHeight/16*2);
            this.ctx.lineTo(this.slider_x+7, this.timelineHeight/16*2);
            this.ctx.moveTo(this.slider_x-7, this.timelineHeight/16*3);
            this.ctx.lineTo(this.slider_x+7, this.timelineHeight/16*3);
            this.ctx.stroke();
            this.ctx.strokeStyle='#000000';
            this.ctx.lineWidth=1;
        }
        initDragging() {
    this.canvas.addEventListener('mousedown', (e: MouseEvent) => {
        const rect = this.canvas.getBoundingClientRect();
        if ((this.mouseX >= this.slider_x - 10 && this.mouseX <= this.slider_x + 10 &&
            this.mouseY >= 0 && this.mouseY <= this.timelineHeight / 4) ||
            (this.mouseX >= this.slider_x - 3 && this.mouseX <= this.slider_x + 3 && this.mouseY >= 0 && this.mouseY <= this.timelineHeight)) {
            this.isDragging = true;
            this.scale_decreasing = false;
            this.canvas.style.cursor = 'grabbing';
        } else if (this.mouseX > 0 && this.mouseX < this.W - 50 && this.mouseY > 0 && this.mouseY < this.timelineHeight) {
            this.slider_x = this.mouseX;
            this.isDragging = true;
            this.choosenDate = this.getDateFromX();
            this.emitChange(this.choosenDate);
        }
    });
    this.canvas.addEventListener('mouseup', (e: MouseEvent) => {
        this.isDragging = false;
        this.scale_decreasing = true;
        this.canvas.style.cursor = 'default';
        this.choosenDate = this.getDateFromX();
        this.emitChange(this.choosenDate);
    });
}
        init_keyboard_events(){
            document.addEventListener('keydown', (e: KeyboardEvent)=>{
                if (e.code=='Space'){
                    e.preventDefault();      
                    e.stopPropagation(); 
                    this.scale_lock=!this.scale_lock;
                    //console.log(this.scale_lock);
                }
            })
        }
        lock_visualization(){
            if (!this.lockImageReady) return;
            try{
                this.ctx.fillStyle='black';
                this.ctx.font= `14px "Segoe UI", Arial, sans-serif`;
                
                if(this.scale_lock) this.ctx.drawImage(this.lock_image, 0, 150, 500, 800, this.W-40, 0, 30, 50);
                else this.ctx.drawImage(this.lock_image, 500, 150, 1000, 800, this.W-40, 0, 60, 50);
                this.ctx.fillText('[Space]', this.W-25, this.timelineHeight/5*4);
            }catch(error){
                console.warn('png not found!')
            }
            
        }
        update(){
    try {
        this.ctx.clearRect(0, 0, this.W, this.H);

        const rect = this.canvas.getBoundingClientRect();
        if (Math.abs(this.canvas.width - rect.width) > 1) {
            this.canvas.width = rect.width;
            this.W = this.canvas.width;
            this.scale = (this.W - 50) / (this.end.getTime() - this.start.getTime()); 
            if (this.choosenDate) this.slider_x = this.timeToX(this.choosenDate.getTime());
        } else {
            this.W = this.canvas.width;
            this.H = this.canvas.height;
        }

        this.checkForMoving();

        this.scale = (this.W - 50) / (this.end.getTime() - this.start.getTime());
        if (this.isDragging && !this.cursorMoving && !this.scale_lock && this.scale < this.max_scale) {
            this.smartZoom();
        }
        if (!this.isDragging && !this.scale_lock && this.scale > this.min_scale) {
            const k = 1 / 1.01;
            this.smartZoom(k);
        }
        this.initScrolling();

        this.ctx.clearRect(0, 0, this.W, this.H);
        this.drawTimeline();
        // Убираем очистку левой области (было 0,0,50,this.H)
        this.ctx.clearRect(this.W - 50, 0, 50, this.H); 
        this.drawSlider();
        this.lock_visualization();
        requestAnimationFrame(this.update.bind(this));

    } catch (error) {
        console.log('Ошибка анимации');
    }
}
        getDate(): Date| null{
            return this.choosenDate;
        }
        smartZoom(k = 1.01) {
    if (this.scale < this.min_scale && k < 1 || this.scale > this.max_scale && k > 1) return;
    this.choosenDate = this.getDateFromX();
    if (!this.choosenDate) return;
    const h = this.scale;
    const t_a = this.start.getTime();
    const t_cur = this.choosenDate.getTime();
    const t_a1 = (t_cur * (k - 1) + t_a) / k;
    this.start = new Date(t_a1);
    this.scale = h * k;
    const t_b = t_a1 + (this.W - 50) / this.scale; 
    this.end = new Date(t_b);
}
        initScrolling() {
    if (!this.choosenDate) return;
    const offset = Math.pow(Math.abs((this.slider_x - this.mouseX) * 0.1), 3);
    if (this.isDragging) {
        if (this.slider_x <= 10) {
            if (this.start.getTime() < this.absoluteStart.getTime()) return;
            this.start = new Date(this.start.getTime() - 1 / this.scale * offset * 1000 * 60 * 60 / 10000000 * 2);
            this.end = new Date(this.end.getTime() - 1 / this.scale * offset * 1000 * 60 * 60 / 10000000 * 2);
        }
        if (this.slider_x >= this.W - 60) {
            if (this.end.getTime() > this.absoluteEnd.getTime()) return;
            this.start = new Date(this.start.getTime() + 1 / this.scale * offset * 1000 * 60 * 60 / 10000000 * 2);
            this.end = new Date(this.end.getTime() + 1 / this.scale * offset * 1000 * 60 * 60 / 10000000 * 2);
        }
    }
}
        public onChange(callback: (date: Date) => void) {
            this.changeListeners.push(callback);
        }
        private emitChange(date: Date) {
            for (const cb of this.changeListeners) {
                cb(date);
            }
        }

        
    }
    