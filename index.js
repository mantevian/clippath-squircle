const form = document.querySelector("form");
const formInputs = form.querySelectorAll("input, select");
const textarea = document.querySelector("textarea");
const example = document.querySelector("#result > div > div");

/**
 * @typedef Corners
 * @property {boolean} upLeft
 * @property {boolean} upRight
 * @property {boolean} downLeft
 * @property {boolean} downRight
*/

function update() {
	let data = new FormData(form);
	let result = figmaSquircle(
		parseFloat(data.get("smoothing")),
		parseFloat(data.get("radius")),
		parseFloat(data.get("precision")),
		{
			upLeft: data.get("upleft") === "on",
			upRight: data.get("upright") === "on",
			downLeft: data.get("downleft") === "on",
			downRight: data.get("downright") === "on"
		}
	);

	textarea.textContent = result;
	example.style.clipPath = result;
}

update();

formInputs.forEach(input => {
	input.addEventListener("input", _ => {
		update();
	});
});

/**
 * @param {number} value 
 * @param {number} precision 
 * @returns {number}
 */
function round(value, precision) {
	let e = Math.pow(10, precision);
	return Math.floor(value * e) / e;
}

/**
 * @param {number} smoothing 
 * @param {number} borderRadius 
 * @param {number} count 
 * @param {Corners} corners 
 * @returns {string}
 */
function figmaSquircle(smoothing, borderRadius, count, corners) {
	/**
	 * @param {number} t 
	 * @returns {number}
	 */
	let fnX = t => {
		let circle = 1 + Math.cos((-t * 0.5 + 1.0) * Math.PI);
		let smoothed = 1.93 * Math.pow(t, 2.72);

		return borderRadius * (circle * (1 - smoothing) + smoothed * smoothing);
	};

	/**
	 * @param {number} t 
	 * @returns {number}
	 */
	let fnY = t => {
		let circle = 1 + Math.sin((t * 0.5 + 1.0) * Math.PI);
		let smoothed = 1.93 * Math.pow(1 - t, 2.72);

		return borderRadius * (circle * (1 - smoothing) + smoothed * smoothing);
	};

	let points = createParametric(count, fnX, fnY);

	return str(points, corners);
}

/**
 * @param {number} count 
 * @param {(t: number) => number} fnX 
 * @param {(t: number) => number} fnY
 * @returns {number[]}
 */
function createParametric(count, fnX, fnY) {
	let points = [];

	let step = 1 / count;

	for (let i = 0; i < count; i++) {
		let t = step * i;

		let x = fnX(t);
		let y = fnY(t);

		points[i * 2] = x;
		points[i * 2 + 1] = y;
	}

	return points;
}

/**
 * @param {number[]} points 
 * @param {Corners} corners 
 * @returns {string}
 */
function str(points, corners) {
	let count = points.length / 2;

	let result = "polygon(";

	if (corners.upLeft) {
		for (let i = 0; i < count; i++) {
			let x = points[i * 2];
			let y = points[i * 2 + 1];
			result += `${round(x, 1)}px ${round(y, 1)}px, `;
		}
	} else {
		result += "0 0, ";
	}

	if (corners.upRight) {
		for (let i = 0; i < count; i++) {
			let x = points[(count - i - 1) * 2];
			let y = points[(count - i - 1) * 2 + 1];
			result += `calc(100% - ${round(x, 1)}px) ${round(y, 1)}px, `;
		}
	} else {
		result += "100% 0, ";
	}

	if (corners.downRight) {
		for (let i = 0; i < count; i++) {
			let x = points[i * 2];
			let y = points[i * 2 + 1];
			result += `calc(100% - ${round(x, 1)}px) calc(100% - ${round(y, 1)}px), `;
		}
	} else {
		result += "100% 100%, ";
	}

	if (corners.downLeft) {
		for (let i = 0; i < count; i++) {
			let x = points[(count - i - 1) * 2];
			let y = points[(count - i - 1) * 2 + 1];
			result += `${round(x, 1)}px calc(100% - ${round(y, 1)}px)`;

			if (i < count - 1) {
				result += ", ";
			}
		}
	} else {
		result += "0 100%";
	}

	result += ")";

	return result;
}