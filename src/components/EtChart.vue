<template>
	<div class="desktop">
		<section class="moisture">
			<div class="et">
				<div class="date">
					<div class="title">
						<div class="label">ET根系分布/分层耗水量</div>
					</div>
					<span v-if="!showEtEmpty">
                            {{
							dateFormat(etDate)
						}}
                        </span>
					<img
						v-if="!showEtEmpty"
						:src="getPlayIcon()"
						@click="handleEtPlay(true)"
					>
				</div>
				<div
					id="et-chart"
					v-if="!showEtEmpty"
				></div>
				<EmptyPage
					img="/icon-empty-device.png" message="暂无数据" v-if="showEtEmpty"
					style="background: #ffffff;height: 410px"
				></EmptyPage>
				<section class="et-root" v-if="!showEtEmpty">
					<img src="/icon-root.svg">
					<label>根系深度</label>
				</section>
			</div>
		</section>
	</div>
</template>

<script>
import ETChart from './charts/et-chart.js';
import dayjs from 'dayjs';
import EmptyPage from './EmptyPage.vue';
import chart from "@insentek/chart";


export default {
	name: 'EtChart',
	components: {
		EmptyPage
	},

	props: {
		chartInfo: {
			type: Object,
			required: true
		}
	},
	data() {
		return {
			dayjs,
			etDate: undefined,
			etData: [],
			etCurrentTime: 0,
			etTimeOut: [],
			etArrPlay: [],
			etTotal: 0,
			etChart: undefined,
			showEtEmpty: false,
			etPlay: false,
			play: false,
			playOnly: false,
		};
	},
	computed: {
		dateFormat() {
			return function (etDate) {
				if (etDate) {
					const str = `${etDate.slice(0, 4)}/${etDate.slice(4)}`;
					const result = `${str.slice(0, 7)}/${etDate.slice(6)}`;
					return result;
				}
				return '--';
			};
		}
	},
	watch: {
	},
	beforeUnmount() {
		// 移除窗口resize监听器
		window.removeEventListener('resize', this.resizeChart);
		if (this.etChart !== null) {
			this.etChart.chart.dispose();
		}
	},
	async mounted() {
		this.initEtChart();
		// 添加窗口resize监听器
		window.addEventListener('resize', this.resizeChart);
	},

	methods: {
		//获取ET图播放图标
		getPlayIcon() {
			return this.etPlay ? '/icon-pause.svg' : '/icon-play-normal.svg';
		},
		resizeChart() {
			if (this.etChart) {
				this.etChart.chart.resize();
			}
		},

		// ET根系图初始化
		async initEtChart() {
			/**
			 * vm - 实例
			 * container - 容器id
			 * options - 图表配置
			 * lineStyle - 线样式
			 */
			this.etChart = new chart.ETChart(this, 'et-chart',{},
				{
					color: '#3E7AE0',
					areaColor: '#84a7e1',
				}
			).loading();

			// 获取数据
			this.etData =  {
				"data": {
					"amendSeries": [
						[
							2.31,
							1.45,
							2.63,
							2.63,
							0.01,
							5.31
						],
						[
							2.29,
							0.61,
							2.99,
							2.77,
							0.01,
							5.95
						],
						[
							3.27,
							0.13,
							3.19,
							2.95,
							0.01,
							6.59
						],
						[
							3.83,
							0.01,
							3.31,
							2.67,
							0.01,
							6.83
						],
						[
							3.93,
							0.01,
							3.21,
							2.41,
							0.01,
							6.83
						],
						[
							3.89,
							0.07,
							3.09,
							2.17,
							0.01,
							6.65
						],
						[
							3.73,
							0.01,
							2.97,
							1.79,
							0.01,
							6.05
						]
					],
					"dataseries": [
						[
							1.88,
							2.04,
							2.63,
							1.32,
							2.66
						],
						[
							1.45,
							1.8,
							2.88,
							1.39,
							2.98
						],
						[
							1.7,
							1.66,
							3.07,
							1.48,
							3.3
						],
						[
							1.92,
							1.58,
							2.99,
							1.34,
							3.42
						],
						[
							1.97,
							1.53,
							2.81,
							1.21,
							3.42
						],
						[
							1.98,
							1.58,
							2.63,
							1.09,
							3.33
						],
						[
							1.87,
							1.46,
							2.38,
							0.9,
							3.03
						]
					],
					"depthseries": [
						[
							0,
							10,
							20,
							30,
							40,
							50
						],
						[
							0,
							10,
							20,
							30,
							40,
							50
						],
						[
							0,
							10,
							20,
							30,
							40,
							50
						],
						[
							0,
							10,
							20,
							30,
							40,
							50
						],
						[
							0,
							10,
							20,
							30,
							40,
							50
						],
						[
							0,
							10,
							20,
							30,
							40,
							50
						],
						[
							0,
							10,
							20,
							30,
							40,
							50
						]
					],
					"nodes": [
						"地表",
						"10",
						"20",
						"30",
						"40",
						"50",
						"60"
					],
					"timeseries": [
						"20240505",
						"20240506",
						"20240507",
						"20240508",
						"20240509",
						"20240510",
						"20240511"
					],
					"series": [
						[
							17.9,
							19.4,
							25.0,
							12.6,
							25.2
						],
						[
							13.8,
							17.1,
							27.4,
							13.2,
							28.4
						],
						[
							15.2,
							14.8,
							27.4,
							13.2,
							29.5
						],
						[
							17.0,
							14.0,
							26.6,
							11.9,
							30.4
						],
						[
							18.0,
							14.0,
							25.7,
							11.1,
							31.3
						],
						[
							18.7,
							14.9,
							24.8,
							10.2,
							31.4
						],
						[
							19.4,
							15.1,
							24.6,
							9.4,
							31.5
						]
					]
				},
				"code": 0,
				"message": "ok"
			}

			const data = this.etData.data;

			//空数据处理
			if (data.timeseries.length <= 0) {
				this.showEtEmpty = true;
				this.etChart = new ETChart(this, 'et-chart');
				return;
			}

			//展示图表
			const {
				etDate,
			} = this.etChart.show(data);
			this.etDate = etDate;
		},

		handlePlaybackComplete() {
			console.log('播放完成');
			this.etPlay = false;
			this.play = false;
			this.playOnly = false;
		},

		// ET曲线播放
		async handleEtPlay(playOnly) {
			this.playOnly = playOnly;
			// 播放暂停实现：通过记录当前暂停的index，下次播放时从当前暂停的index开始播放。
			const data = this.etData.data;
			this.etPlay = !this.etPlay;

			/**
			 * 监听播放完成事件
			 */
			document.addEventListener('etPlaybackComplete', this.handlePlaybackComplete);

			// 播放
			if (this.etPlay) {
				try	{
					//播放ET图
					/**
					 * @param {Array} data - 数据
					 * @param {Number} interval - 播放间隔
					 */
					this.etChart.play(data, 1000);
					let _this = this
					//监听播放事件
					document.addEventListener('etDataUpdated', function (e) {
						// 修改页面展示变量值
						// 时间
						_this.etDate = e.detail.etDate;
					});
				}catch (error) {
					console.error('Error processing ET chart data:', error);
				}
			}
			// 暂停
			if (!this.etPlay) {
				this.etChart.pause();
			}
		},
	}
};
</script>

<style scoped lang="less">

.desktop {
	margin-top: 32px;

	& .moisture {
		display: flex;
		width: 100%;
		height: 502px;
		position: relative;

		& .play-all {
			position: absolute;
			width: 48px;
			height: auto;
			left: 0;
			right: 0;
			bottom: 0;
			top: 0;
			margin: auto;
			cursor: pointer;
		}

		& .et {
			width: 50%;
			height: inherit;
			position: relative;

			& #et-chart {
				height: 440px;
				width: 370px;
				transform: rotate(90deg);
				transform-origin: center;
				position: absolute;
				top: -40px;
				left: 0;
				bottom: 0;
				margin: auto;
				right: 0;
			}

			& .et-root {
				width: 100%;
				display: flex;
				justify-content: flex-start;
				position: absolute;
				align-items: center;
				left: 20px;
				bottom: 52px;

				& img {
					width: 24px;
					height: 4px;
				}

				& label {
					font-size: 12px;
					font-family: HarmonyOS;
					line-height: 12px;
					color: #8C909A;
					margin-left: 8px;
				}

			}
		}

		& .date {
			padding: 0 24px 0;
			width: 100%;
			display: flex;
			justify-content: space-between;
			align-items: center;
			height: 46px;
			font-size: 14px;
			font-family: HarmonyOS;
			line-height: 14px;
			box-sizing: border-box;
			position: relative;

			& span {
				color: rgba(0, 7, 30, 0.65);
				text-align: center;
				font-family: HarmonyOS;
				font-size: 12px;
				font-style: normal;
				font-weight: 400;
				line-height: 12px; /* 100% */
				letter-spacing: 0.167px;
				position: absolute;
				left: 50%;
				transform: translateX(-50%);
			}

			& .title {
				display: flex;

				& .label {
					color: rgba(0, 7, 30, 0.65);
					font-family: HarmonyOS;
					font-size: 14px;
					font-style: normal;
					font-weight: 400;
					line-height: 14px; /* 100% */
				}

				& img {
					width: 12px;
					height: 12px;
					cursor: pointer;
					margin-left: 8px;
					cursor: pointer;
				}
			}

			& img {
				cursor: pointer;
			}
		}
	}
}

</style>
