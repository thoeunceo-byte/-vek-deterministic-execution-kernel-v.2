/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { Block } from '../types';
import { wrappingAdd, wrappingSub } from '../utils/kernel';

interface VarianceChartProps {
  ledger: Block[];
  threshold: number;
  shadowTrackEnabled: boolean;
}

interface DataPoint {
  index: number;
  event: string;
  proposed: number;
  predicted: number;
  variance: number;
  isSynthetic: boolean;
}

export const VarianceChart: React.FC<VarianceChartProps> = ({
  ledger,
  threshold,
  shadowTrackEnabled,
}) => {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Compute the last 20 blocks data
  const data: DataPoint[] = React.useMemo(() => {
    const lastBlocks = ledger.slice(-20);
    return lastBlocks.map((b) => {
      const event = b.step.input_event;
      let proposed = b.step.pre_state.value;
      if (event.startsWith("ADD:")) {
        const val = parseInt(event.slice(4), 10) || 0;
        proposed = wrappingAdd(proposed, val);
      } else if (event.startsWith("SUB:")) {
        const val = parseInt(event.slice(4), 10) || 0;
        proposed = wrappingSub(proposed, val);
      }

      const predicted = b.step.shadow_prediction ?? b.step.pre_state.value;
      const variance = Math.abs(proposed - predicted);

      return {
        index: b.step.logical_clock,
        event,
        proposed,
        predicted,
        variance,
        isSynthetic: !!b.step.is_synthetic,
      };
    });
  }, [ledger]);

  useEffect(() => {
    if (!svgRef.current || !containerRef.current) return;

    // Clean up previous renderings
    d3.select(svgRef.current).selectAll('*').remove();

    if (data.length === 0) return;

    const margin = { top: 15, right: 15, bottom: 25, left: 35 };
    const width = containerRef.current.clientWidth;
    const height = 150;
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const svg = d3
      .select(svgRef.current)
      .attr('width', width)
      .attr('height', height)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // X Scale (Sequential index/clock of last 20 blocks)
    const xScale = d3
      .scalePoint()
      .domain(data.map((d) => String(d.index)))
      .range([0, innerWidth])
      .padding(0.2);

    // Y Scale: max of (variance and threshold * 1.3)
    const maxVariance = d3.max(data, (d) => d.variance) || 0;
    const yMax = Math.max(maxVariance, threshold * 1.3, 100);

    const yScale = d3
      .scaleLinear()
      .domain([0, yMax])
      .range([innerHeight, 0])
      .nice();

    // Gridlines
    const yGrid = d3.axisLeft(yScale).tickSize(-innerWidth).tickFormat(() => '');
    svg
      .append('g')
      .attr('class', 'grid')
      .attr('stroke', 'rgba(255, 255, 255, 0.05)')
      .attr('stroke-dasharray', '2,2')
      .call(yGrid)
      .selectAll('.domain')
      .remove();

    // X-Axis
    const xAxis = d3.axisBottom(xScale).tickFormat((d) => `b${d}`);
    svg
      .append('g')
      .attr('transform', `translate(0,${innerHeight})`)
      .attr('font-family', 'JetBrains Mono, monospace')
      .attr('font-size', '8px')
      .attr('color', '#64748b')
      .call(xAxis)
      .selectAll('.domain, line')
      .attr('stroke', 'rgba(255, 255, 255, 0.1)');

    // Y-Axis
    const yAxis = d3.axisLeft(yScale).ticks(4).tickFormat((d) => `${d}`);
    svg
      .append('g')
      .attr('font-family', 'JetBrains Mono, monospace')
      .attr('font-size', '8px')
      .attr('color', '#64748b')
      .call(yAxis)
      .selectAll('.domain, line')
      .attr('stroke', 'rgba(255, 255, 255, 0.1)');

    // Gradient for the variance area
    const gradientId = 'variance-area-gradient';
    const defs = svg.append('defs');
    const linearGradient = defs
      .append('linearGradient')
      .attr('id', gradientId)
      .attr('x1', '0%')
      .attr('y1', '0%')
      .attr('x2', '0%')
      .attr('y2', '100%');

    linearGradient
      .append('stop')
      .attr('offset', '0%')
      .attr('stop-color', '#6366f1')
      .attr('stop-opacity', 0.25);

    linearGradient
      .append('stop')
      .attr('offset', '100%')
      .attr('stop-color', '#6366f1')
      .attr('stop-opacity', 0);

    // Area Generator
    const areaGenerator = d3
      .area<DataPoint>()
      .x((d) => xScale(String(d.index)) || 0)
      .y0(innerHeight)
      .y1((d) => yScale(d.variance));

    svg
      .append('path')
      .datum(data)
      .attr('fill', `url(#${gradientId})`)
      .attr('d', areaGenerator);

    // Line Generator for variance
    const lineGenerator = d3
      .line<DataPoint>()
      .x((d) => xScale(String(d.index)) || 0)
      .y((d) => yScale(d.variance))
      .curve(d3.curveMonotoneX);

    svg
      .append('path')
      .datum(data)
      .attr('fill', 'none')
      .attr('stroke', '#6366f1')
      .attr('stroke-width', 2)
      .attr('d', lineGenerator);

    // Trust Barrier threshold line
    if (shadowTrackEnabled) {
      const thresholdY = yScale(threshold);
      svg
        .append('line')
        .attr('x1', 0)
        .attr('y1', thresholdY)
        .attr('x2', innerWidth)
        .attr('y2', thresholdY)
        .attr('stroke', '#ef4444')
        .attr('stroke-width', 1.5)
        .attr('stroke-dasharray', '4,4')
        .attr('opacity', 0.8);

      svg
        .append('text')
        .attr('x', innerWidth)
        .attr('y', thresholdY - 5)
        .attr('text-anchor', 'end')
        .attr('fill', '#ef4444')
        .attr('font-family', 'JetBrains Mono, monospace')
        .attr('font-size', '8px')
        .attr('font-weight', 'bold')
        .text(`TRUST LIMIT: ±${threshold}`);
    }

    // Data circles
    svg
      .selectAll('.dot')
      .data(data)
      .enter()
      .append('circle')
      .attr('cx', (d) => xScale(String(d.index)) || 0)
      .attr('cy', (d) => yScale(d.variance))
      .attr('r', (d) => (d.isSynthetic ? 4.5 : 3.5))
      .attr('fill', (d) => (d.isSynthetic ? '#818cf8' : '#06b6d4'))
      .attr('stroke', (d) => (d.isSynthetic ? '#4338ca' : '#0891b2'))
      .attr('stroke-width', 1.5)
      .attr('class', 'cursor-pointer transition-all hover:r-6')
      .append('title')
      .text(
        (d) =>
          `Block #${d.index} [${d.event}]\n` +
          `Primary Proposed: ${d.proposed}\n` +
          `Shadow Predicted: ${d.predicted}\n` +
          `Variance: ${d.variance}\n` +
          `Mode: ${d.isSynthetic ? 'SYNTHETIC OVERRIDE' : 'PRIMARY TRUSTED'}`
      );
  }, [data, threshold, shadowTrackEnabled]);

  return (
    <div ref={containerRef} className="w-full" id="variance-chart-container">
      {data.length === 0 ? (
        <div className="h-[150px] flex flex-col items-center justify-center border border-dashed border-sleek-border rounded-lg bg-sleek-sidebar/20 text-xs text-sleek-text-muted italic">
          Awaiting state transitions to map trust decay...
        </div>
      ) : (
        <svg ref={svgRef} className="overflow-visible" id="variance-chart-svg" />
      )}
    </div>
  );
};
