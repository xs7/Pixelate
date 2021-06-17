export default class SLIC {
    constructor(imageArray, width, height) {
        this.rgbImage = Uint8ClampedArray.from(imageArray)
        this.imageArray = Array.from(imageArray)
        this.width = width
        this.height = height
        console.log("Total pixel :", this.width * this.height)
        console.log("width :", width)
        console.log("height: ", height)
    }


    rgb2lab(sR, sG, sB) {
        //rgb2xyz
        let R = sR / 255
        let G = sG / 255
        let B = sB / 255

        let r, g, b
        if (R <= 0.04045) r = R / 12.92
        else r = Math.pow((R + 0.055) / 1.055, 2.4)
        if (G <= 0.04045) g = G / 12.92
        else g = Math.pow((G + 0.055) / 1.055, 2.4)
        if (B <= 0.04045) b = B / 12.92
        else b = Math.pow((B + 0.055) / 1.055, 2.4)

        let X, Y, Z
        X = r * 0.4124564 + g * 0.3575761 + b * 0.1804375
        Y = r * 0.2126729 + g * 0.7151522 + b * 0.0721750
        Z = r * 0.0193339 + g * 0.1191920 + b * 0.9503041

        //xyz2lab
        let epsilon = 0.008856	//actual CIE standard
        let kappa = 903.3		//actual CIE standard

        let Xr = 0.950456	//reference white
        let Yr = 1.0		//reference white
        let Zr = 1.088754	//reference white
        let xr = X / Xr
        let yr = Y / Yr
        let zr = Z / Zr

        let fx, fy, fz
        if (xr > epsilon) fx = Math.pow(xr, 1.0 / 3.0)
        else fx = (kappa * xr + 16.0) / 116.0
        if (yr > epsilon) fy = Math.pow(yr, 1.0 / 3.0)
        else fy = (kappa * yr + 16.0) / 116.0
        if (zr > epsilon) fz = Math.pow(zr, 1.0 / 3.0)
        else fz = (kappa * zr + 16.0) / 116.0

        let lval = 116.0 * fy - 16.0
        let aval = 500.0 * (fx - fy)
        let bval = 200.0 * (fy - fz)

        return { l: lval, a: aval, b: bval }
    }

    lab2rgb(sL, sA, sB) {

    }


    showCenters(ctx) {

        // let canvas = document.getElementById("canvas")
        // let ctx = canvas.getContext("2d")
        //ctx.fillStyle = "#FF0000"
        ctx.fillStyle = "#" + ("00000" + ((Math.random() * 16777215 + 0.5) >> 0).toString(16)).slice(-6)
        for (let i = 0; i < this.centers.length; i++) {
            //console.log(this.centers[i].x + "  " + this.centers[i].y)
            ctx.fillRect(this.centers[i].y, this.centers[i].x, 5, 5)
        }
    }

    showContours(ctx) {
        let dx8 = [-1, -1, 0, 1, 1, 1, 0, -1]
        let dy8 = [0, -1, -1, -1, 0, 1, 1, 1]

        let contours = []
        let istaken = Array.from({ length: this.height }).map(linearray =>
            linearray = Array.from({ length: this.width }).map(item => item = false))

        for (let i = 0; i < this.height; i++) {
            for (let j = 0; j < this.width; j++) {
                let nr_p = 0

                /* Compare the pixel to its 8 neighbours. */
                for (let k = 0; k < 8; k++) {
                    let x = i + dx8[k], y = j + dy8[k]

                    if (x >= 0 && x < this.height && y >= 0 && y < this.width) {
                        if (istaken[x][y] == false && this.clusterID[i * this.width + j] != this.clusterID[x * this.width + y]) {
                            nr_p += 1
                        }
                    }
                }

                /* Add the pixel to the contour list if desired. */
                if (nr_p >= 2) {
                    contours.push({
                        x: i,
                        y: j
                    })
                    istaken[i][j] = true
                }
            }
        }
        for (let i = 0; i < contours.length; i++) {
            // let ctx = this.canvas.getContext("2d")
            ctx.fillStyle = "#ffffff"
            ctx.fillRect(contours[i].y, contours[i].x, 2, 2)
        }
    }


    findLocalMinimum(hpos, wpos) {
        let min_grad = Number.MAX_VALUE
        let loc_min = {}

        for (let i = hpos - 1; i <= hpos + 1 && i >= 0 && i < this.height - 1; i++) {
            for (let j = wpos - 1; j <= wpos + 1 && j >= 0 && j < this.width - 1; j++) {
                let i1 = this.imageArray[4 * (i * this.width + j + 1)]//right pixel
                let i2 = this.imageArray[4 * ((i + 1) * this.width + j + 1)] // bottom pixel
                let i3 = this.imageArray[4 * (i * this.width + j)] // self
                if (Math.sqrt(Math.pow(i1 - i3, 2)) + Math.sqrt(Math.pow(i2 - i3, 2)) < min_grad) {
                    min_grad = Math.abs(i1 - i3) + Math.abs(i2 - i3)
                    loc_min.x = i
                    loc_min.y = j
                }
            }
        }
        return loc_min
    }

    computeDist(centerPos, pixX, pixY) {
        // if(pixX <=2)
        // console.log(pixX, pixY)

        let center = this.centers[centerPos]
        //     let v1=Math.pow(center.l - this.image[pixX][pixY][0],2)
        //     let v2=Math.pow(center.a - this.image[pixX][pixY][1],2)
        //     let v3=Math.pow(center.b - this.image[pixX][pixY][2],2)

        //    let temp=(Math.pow(center.l - this.image[pixX][pixY][0],2) + Math.pow(center.a - this.image[pixX][pixY][1],2)+ Math.pow(center.b - this.image[pixX][pixY][2],2))

        let dc = Math.sqrt(Math.pow(center.l - this.imageArray[4 * (pixX * this.width + pixY)], 2)
            + Math.pow(center.a - this.imageArray[4 * (pixX * this.width + pixY) + 1], 2)
            + Math.pow(center.b - this.imageArray[4 * (pixX * this.width + pixY) + 2], 2))
        let ds = Math.sqrt(Math.pow(center.x - pixX, 2) + Math.pow(center.y - pixY, 2))

        return Math.pow(dc / this.weight, 2) + Math.pow(ds / this.step, 2)
    }

    computePixel() {
        console.log("computing.............................")
        //Initialize cluster centers by sampling pixels at regualr grid step 
        this.clusterID = Array.from({ length: this.width * this.height }).map(item => item = -1)
        this.centers = new Array()

        for (let i = this.step; i < this.height; i += this.step) {
            for (let j = this.step; j < this.width; j += this.step) {
                let center = this.findLocalMinimum(i, j)
                center.l = (this.imageArray)[4 * (center.x * this.width + center.y)]
                center.a = (this.imageArray)[4 * (center.x * this.width + center.y) + 1]
                center.b = (this.imageArray)[4 * (center.x * this.width + center.y) + 2]
                this.centers.push(center)
            }
        }

        //Interations
        for (let i = 0; i < this.iters; i++) {
            // minimum distance to centers 
            let distances = Array.from({ length: this.width * this.height }).map(item => item = Number.MAX_VALUE)

            for (let j = 0; j < this.centers.length; j++) {
                for (let m = this.centers[j].x - this.step; m < this.centers[j].x + this.step; m++) {
                    for (let n = this.centers[j].y - this.step; n < this.centers[j].y + this.step; n++) {
                        if (m >= 0 && m < this.height && n >= 0 && n < this.width) {
                            //console.log(this.centers[j].x, this.centers[j].y, intStep)
                            let d = this.computeDist(j, m, n)
                            if (d < distances[m * this.width + n]) {
                                distances[m * this.width + n] = d
                                this.clusterID[m * this.width + n] = j
                            }
                        }
                    }
                }
            }


            let oldcenters = JSON.parse(JSON.stringify(this.centers))
            //clear old value
            for (var ele of this.centers) {
                ele.c = ele.l = ele.a = ele.b = ele.x = ele.y = 0
            }

            //compute new cluster centers

            for (let j = 0; j < this.height; j++)
                for (let k = 0; k < this.width; k++) {
                    let c = this.clusterID[j * this.width + k]
                    if (c != -1) {
                        this.centers[c].l += this.imageArray[4 * (j * this.width + k)]
                        this.centers[c].a += this.imageArray[4 * (j * this.width + k) + 1]
                        this.centers[c].b += this.imageArray[4 * (j * this.width + k) + 2]
                        this.centers[c].x += j
                        this.centers[c].y += k
                        this.centers[c].c += 1
                    }
                }

            for (var index in this.centers) {
                if (this.centers[index].c == 0 || this.centers[index].x == undefined || this.centers[index].y == undefined) {
                    // this.centers[index]= JSON.parse(JSON.stringify(oldcenters[index]))
                    //    console.log("--")
                    // console.log(index,this.centers[index].c,this.centers[index].x,this.centers[index].y)
                    this.centers[index] = JSON.parse(JSON.stringify(oldcenters[index]))
                    // console.log(index,this.centers[index].c,this.centers[index].x,this.centers[index].y)

                    let canvas = document.getElementById("canvas")
                    let context = canvas.getContext("2d")
                    context.fillRect(this.centers[index].y, this.centers[index].x, 10, 10)
                }
                else {
                    this.centers[index].l /= this.centers[index].c
                    this.centers[index].a /= this.centers[index].c
                    this.centers[index].b /= this.centers[index].c
                    this.centers[index].x = Math.floor(this.centers[index].x / this.centers[index].c)
                    this.centers[index].y = Math.floor(this.centers[index].y / this.centers[index].c)
                }
            }
        }
        console.log("compute done.............................")
    }

    pickPixel() {
        console.log("paiting...................")
        // pick pixel 
        let row = Math.ceil(this.height / this.stride)
        let col = Math.ceil(this.width / this.stride)
        let resultImage = new Uint8ClampedArray(this.width * this.height * 4)

        // iteration for every pix rectangle
        for (let m = 0; m < row; m++) {
            for (let n = 0; n < col; n++) {

                let startj = m * this.stride
                let startk = n * this.stride
                let counts = {}

                for (let j = startj; j < startj + this.stride && j < this.height; j++) {
                    for (let k = startk; k < startk + this.stride && k < this.width; k++) {
                        let c = this.clusterID[j * this.width + k]
                        if (c != -1) {
                            if (counts[c]) {
                                counts[c]++
                            } else {
                                counts[c] = 1
                            }
                        }
                    }
                }
                let centerpos = -1
                let max = Number.MIN_VALUE
                for (let pos in counts) {
                    if (counts[pos] > max) {
                        max = counts[pos]
                        centerpos = pos
                    }
                }

                for (let j = startj; j < startj + this.stride && j < this.height; j++) {
                    for (let k = startk; k < startk + this.stride && k < this.width; k++) {
                        resultImage[4 * (j * this.width + k)] = this.rgbImage[4 * (this.centers[centerpos].x * this.width + this.centers[centerpos].y)]
                        resultImage[4 * (j * this.width + k) + 1] = this.rgbImage[4 * (this.centers[centerpos].x * this.width + this.centers[centerpos].y) + 1]
                        resultImage[4 * (j * this.width + k) + 2] = this.rgbImage[4 * (this.centers[centerpos].x * this.width + this.centers[centerpos].y) + 2]
                        resultImage[4 * (j * this.width + k) + 3] = this.rgbImage[4 * (this.centers[centerpos].x * this.width + this.centers[centerpos].y) + 3]
                    }
                }
            }
        }
        console.log("paiting done...................")
        return resultImage
    }

    //pixelate image
    pixelDeal(step, iters, stride, weight) {
        this.step = step
        this.iters = iters
        this.stride = stride
        this.weight = weight
        console.log("step :", step)
        console.log("iters :", iters)
        console.log("weight :", weight)
        console.log("stride :", stride)

        //tranlate rgb to lab
        for (let i = 0; i < this.width * this.height; i += 4) {
            let labColor = this.rgb2lab(this.imageArray[i], this.imageArray[i + 1], this.imageArray[i + 2])
            this.imageArray[i] = labColor.l
            this.imageArray[i + 2] = labColor.a
            this.imageArray[i + 3] = labColor.b
        }
        this.computePixel()
        let result = this.pickPixel()

        return result
    }
    changeBlockSize(blockSize) {
        this.step = blockSize
        this.computePixel()
        let result = this.pickPixel()
        return result
    }
    changeWeight(weight) {
        this.weight = weight
        this.computePixel()
        let result = this.pickPixel()
        return result
    }
    changeStride(stride) {
        this.stride = stride
        let result = this.pickPixel()
        return result
    }
    changeIters(iters) {
        this.iters = iters
        this.computePixel()
        let result = this.pickPixel()
        return result
    }


}